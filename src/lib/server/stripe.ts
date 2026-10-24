import { STRIPE_SECRET_KEY } from "$app/env/private";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily construct the Stripe client. Returns null when no secret key is set. */
export function getStripe(): Stripe | null {
  if (client) return client;
  const key = STRIPE_SECRET_KEY;
  if (!key) return null;
  client = new Stripe(key);
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}
