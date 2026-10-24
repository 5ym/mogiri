# --- Build stage ----------------------------------------------------------
FROM oven/bun:1.4 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# 公開 URL の origin (例: https://your-domain)。SvelteKit の `paths.origin` として
# ビルド時に埋め込む (adapter-bun に実行時の ORIGIN は無い)。空なら
# リクエストの Host から求める (vite.config.ts)。
ARG ORIGIN=
RUN ORIGIN=$ORIGIN bun run build
# The runtime stage has no shell, so the data directory is made here and copied
# across already owned by the runtime user (a fresh volume takes its owner from it).
RUN mkdir -p /out/data

# --- Runtime stage --------------------------------------------------------
# All dependencies are bundled into build/ (devDependencies are bundled by
# adapter-bun; the runtime dependencies list is empty), so the runtime image
# needs no node_modules — just Bun and the build output.
# Distroless Bun: no shell or package manager, only the runtime and the glibc,
# CA certificates and tzdata it needs. Runs as 1000:1000 (the slim image's bun
# user) rather than root.
FROM oven/bun:1.4-distroless AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/mogiri.db
USER 1000:1000

COPY --from=build --chown=1000:1000 /out/ ./
COPY --from=build /app/build ./build
# Seed script (optional): run with `bun run ./src/lib/server/db/seed.ts`
COPY --from=build /app/src/lib/server/db/ddl.ts ./src/lib/server/db/ddl.ts
COPY --from=build /app/src/lib/server/db/seed.ts ./src/lib/server/db/seed.ts

# Persist the SQLite database outside the image layer.
VOLUME /app/data
EXPOSE 3000

# The server must run under Bun so `bun:sqlite` is available. The entrypoint is
# bun itself (the base image's too); spelled out so CMD is only the arguments.
ENTRYPOINT ["/usr/local/bin/bun"]
CMD ["./build"]
