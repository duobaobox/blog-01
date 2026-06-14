ARG APT_MIRROR=http://mirrors.tuna.tsinghua.edu.cn
ARG NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

FROM node:22-bookworm-slim AS base

ARG APT_MIRROR
ARG NPM_CONFIG_REGISTRY

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY

RUN sed -i "s|http://deb.debian.org|${APT_MIRROR}|g; s|http://security.debian.org|${APT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder

COPY . .
RUN npm run db:generate
RUN BETTER_AUTH_SECRET=6f8b9e1a25f7d4c0b3a91e7f2d5c8a0469b2e0f4a7c3d1e8f5b6a9c0d2e4f7a1 BETTER_AUTH_URL=http://localhost:3000 npm run build

FROM deps AS prod-deps

RUN npm prune --omit=dev

FROM deps AS tools

COPY . .
RUN npm run db:generate

FROM base AS runner

ARG APT_MIRROR
ARG NPM_CONFIG_REGISTRY

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
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN install -d -o nextjs -g nodejs -m 750 /app/public/media \
  && chmod -R 750 /app/public \
  && chmod 755 /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
