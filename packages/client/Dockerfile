# ============================================================
# Dockerfile — @idle/client (Vite + React)
# Dev server avec hot-reload
# ============================================================

FROM node:24-alpine AS base
WORKDIR /app

# --- Copier les fichiers de config du monorepo ---
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/

# --- Installer les dépendances ---
RUN npm install --workspace=@idle/client --workspace=@idle/shared

# --- Copier le code source ---
COPY packages/shared/ ./packages/shared/
COPY packages/client/ ./packages/client/

# --- Exposer le port Vite ---
EXPOSE 5173

# --- Dev : Vite dev server ---
CMD ["npm", "run", "dev", "--workspace=@idle/client"]
