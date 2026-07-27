ARG APT_MIRROR=
ARG NPM_CONFIG_REGISTRY=https://registry.npmjs.org

FROM node:22-bookworm-slim AS base

ARG APT_MIRROR
ARG NPM_CONFIG_REGISTRY

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY

RUN if [ -n "$APT_MIRROR" ]; then \
      sed -i "s|http://deb.debian.org|${APT_MIRROR}|g; s|http://security.debian.org|${APT_MIRROR}|g; s|https://deb.debian.org|${APT_MIRROR}|g; s|https://security.debian.org|${APT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources; \
    fi \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder

COPY . .
RUN npm run db:generate
RUN BETTER_AUTH_SECRET=build-only-auth-secret-with-more-than-thirty-two-characters \
    BETTER_AUTH_URL=http://localhost:3000 \
    BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000 \
    SITE_URL=http://localhost:3000 \
    ADMIN_SETUP_TOKEN=build-only-setup-token \
    npm run build

FROM deps AS prod-deps

RUN npm prune --omit=dev

FROM deps AS tools

COPY . .
RUN npm run db:generate

FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV PRISMA_HIDE_UPDATE_MESSAGE=true

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/src/shared/lib/db-schema-sync-mode-core.mjs ./src/shared/lib/db-schema-sync-mode-core.mjs
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --chown=nextjs:nodejs scripts/resolve-schema-sync-mode.mjs ./scripts/resolve-schema-sync-mode.mjs
COPY --chown=nextjs:nodejs scripts/schema-sync.sh /usr/local/bin/schema-sync.sh
COPY --chown=nextjs:nodejs scripts/resolve-schema-sync-mode.mjs /usr/local/bin/resolve-schema-sync-mode.mjs
COPY --chown=nextjs:nodejs scripts/validate-production-env.mjs /usr/local/bin/validate-production-env.mjs

RUN install -d -o nextjs -g nodejs -m 750 /app/public/media \
  && chmod -R 750 /app/public \
  && chmod 755 /usr/local/bin/docker-entrypoint.sh /usr/local/bin/schema-sync.sh /usr/local/bin/resolve-schema-sync-mode.mjs /usr/local/bin/validate-production-env.mjs /app/scripts/resolve-schema-sync-mode.mjs

USER nextjs

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
