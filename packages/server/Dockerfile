# ============================================================
# Dockerfile — @idle/server (NestJS)
# Multi-stage pour production, dev avec hot-reload
# ============================================================

FROM node:24-alpine AS base
WORKDIR /app

# --- Copier les fichiers de config du monorepo ---
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/server/nest-cli.json ./packages/server/

# --- Installer les dépendances ---
RUN npm install --workspace=@idle/server --workspace=@idle/shared

# --- Copier le code source ---
COPY packages/shared/ ./packages/shared/
COPY packages/server/ ./packages/server/

# --- Générer le client Prisma ---
RUN cd packages/server && npx prisma generate

# --- Exposer le port ---
EXPOSE 3000

# --- Dev : hot-reload avec nest start --watch ---
CMD ["npm", "run", "dev", "--workspace=@idle/server"]
