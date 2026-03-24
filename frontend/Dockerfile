# ================================================================
# Frontend — Dockerfile (Next.js)
# ================================================================
# Multi-stage build for a production-optimized Next.js image.
# BUILD CONTEXT: ./frontend
# ================================================================

# ==========================
# STAGE 1: Dependencies
# ==========================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package-lock.json package.json ./
RUN npm ci

# ==========================
# STAGE 2: Build
# ==========================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==========================
# STAGE 3: Production
# ==========================
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
