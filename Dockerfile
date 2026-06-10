ARG APT_MIRROR=http://mirrors.tuna.tsinghua.edu.cn
ARG NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

FROM node:22-bookworm-slim AS deps

ARG APT_MIRROR
ARG NPM_CONFIG_REGISTRY

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY

RUN sed -i "s|http://deb.debian.org|${APT_MIRROR}|g; s|http://security.debian.org|${APT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder

COPY . .
RUN npm run db:generate
RUN BETTER_AUTH_SECRET=6f8b9e1a25f7d4c0b3a91e7f2d5c8a0469b2e0f4a7c3d1e8f5b6a9c0d2e4f7a1 BETTER_AUTH_URL=http://localhost:3000 npm run build

FROM node:22-bookworm-slim AS runner

ARG APT_MIRROR

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN sed -i "s|http://deb.debian.org|${APT_MIRROR}|g; s|http://security.debian.org|${APT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/public/media \
  && chown -R nextjs:nodejs /app \
  && chmod -R 750 /app/public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
