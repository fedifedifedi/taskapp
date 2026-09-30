# syntax=docker/dockerfile:1

# Image de production : un seul service Express qui sert l'API (/api) et la SPA React.
# Build : docker build -t taskapp .

ARG NODE_VERSION=24

# ---- Base commune ----------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
# OpenSSL est requis par les moteurs Prisma (migrations).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Manifestes seuls d'abord : la couche des dépendances reste en cache
# tant que package.json / package-lock.json ne changent pas.
FROM base AS manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/

# ---- Build (toutes les dépendances) ---------------------------------------
FROM manifests AS build
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Dépendances de production uniquement (API + shared) ------------------
FROM manifests AS prod-deps
RUN npm ci --omit=dev --no-audit --no-fund \
    --workspace=@taskapp/api --workspace=@taskapp/shared \
  && npm cache clean --force

# ---- Image finale -----------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000

# Le package.json racine (workspaces) n'est pas copié : seuls l'API et shared sont présents.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/prisma.config.ts ./apps/api/
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/api

# Exécution sans privilèges root.
USER node
EXPOSE 3000

# Migrations (pre-deploy Railway / CI) : npm run db:deploy
CMD ["node", "dist/server.js"]
