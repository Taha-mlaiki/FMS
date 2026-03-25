# ================================================================
# API Gateway — Dockerfile
# ================================================================
# Multi-stage build:
#   Stage 1 (builder): Install ALL dependencies, compile TypeScript
#   Stage 2 (production): Copy ONLY the compiled output + prod deps
#
# BUILD CONTEXT: project ROOT (.) — all COPY paths are relative to FMS/
# ================================================================

# ==========================
# STAGE 1: Build Stage
# ==========================
FROM node:20-alpine AS builder
WORKDIR /app

COPY services/api-gateway/package*.json ./
RUN npm ci

COPY services/api-gateway/ .
COPY shared /shared
RUN npm run build

# ==========================
# STAGE 2: Production Stage
# ==========================
FROM node:20-alpine AS production
WORKDIR /app

COPY services/api-gateway/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY proto ./proto

EXPOSE 3001
CMD ["node", "dist/main.js"]
