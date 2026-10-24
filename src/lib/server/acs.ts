import { createHash, createHmac } from "node:crypto";

/**
 * Azure Communication Services — Email send via the REST API, authenticated
 * with the resource access key (HMAC-SHA256 shared-key signing). No Azure SDK
 * dependency; just `fetch` + `node:crypto`.
 *
 * Docs: POST {endpoint}/emails:send?api-version=2023-03-31
 */

export type AcsConfig = {
  endpoint: string;
  accessKey: string;
  senderAddress: string;
};

export type AcsMail = {
  to: string;
  subject: string;
  text: string;
};

const API_VERSION = "2023-03-31";

type EnvLike = { [key: string]: string | undefined };

/** Build ACS config from a connection string or explicit endpoint/key env vars. */
export function parseAcsConfig(env: EnvLike): AcsConfig | null {
  const senderAddress = env.ACS_SENDER_ADDRESS;
  if (!senderAddress) return null;

  const cs = env.ACS_CONNECTION_STRING;
  if (cs) {
    const endpoint = /endpoint=([^;]+)/i.exec(cs)?.[1];
    const accessKey = /accesskey=([^;]+)/i.exec(cs)?.[1];
    if (endpoint && accessKey) return { endpoint, accessKey, senderAddress };
  }

  const endpoint = env.ACS_ENDPOINT;
  const accessKey = env.ACS_ACCESS_KEY;
  if (endpoint && accessKey) return { endpoint, accessKey, senderAddress };

  return null;
}

export async function sendMailAcs(
  config: AcsConfig,
  mail: AcsMail,
): Promise<void> {
  const url = new URL(
    `${config.endpoint.replace(/\/$/, "")}/emails:send?api-version=${API_VERSION}`,
  );
  const body = JSON.stringify({
    senderAddress: config.senderAddress,
    content: { subject: mail.subject, plainText: mail.text },
    recipients: { to: [{ address: mail.to }] },
  });

  // HMAC-SHA256 shared-key signature over (verb, path+query, date;host;contentHash).
  const contentHash = createHash("sha256")
    .update(body, "utf8")
    .digest("base64");
  const date = new Date().toUTCString();
  const host = url.host;
  const stringToSign = `POST\n${url.pathname}${url.search}\n${date};${host};${contentHash}`;
  const signature = createHmac(
    "sha256",
    Buffer.from(config.accessKey, "base64"),
  )
    .update(stringToSign, "utf8")
    .digest("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ms-date": date,
      "x-ms-content-sha256": contentHash,
      Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
    },
    body,
  });

  // ACS accepts the message asynchronously (202 Accepted).
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ACS email failed: ${res.status} ${detail}`);
  }
}
