# syntax=docker/dockerfile:1

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm ci --ignore-scripts

# ── Stage 2: Build frontend ───────────────────────────────────────────────────
FROM deps AS frontend-build
WORKDIR /app

COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ── Stage 3: Build backend ────────────────────────────────────────────────────
FROM deps AS backend-build
WORKDIR /app

COPY backend ./backend
ENV DATABASE_URL="file:./dev.db"
RUN npm run db:generate --workspace=backend && npm run build --workspace=backend

# ── Stage 4: Production image ─────────────────────────────────────────────────
FROM node:20-bookworm-slim AS production

RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx curl ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --omit=dev --ignore-scripts --workspace=backend

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/prisma ./backend/prisma
COPY --from=backend-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/node_modules/@prisma ./node_modules/@prisma
COPY backend/assets ./backend/assets

COPY --from=frontend-build /app/frontend/dist ./frontend

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=file:/data/app.db
ENV PDF_STORAGE_PATH=/data/pdfs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/api/health || exit 1

VOLUME ["/data"]

ENTRYPOINT ["/entrypoint.sh"]
