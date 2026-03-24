# ================================================================
# API Gateway — Dockerfile
# ================================================================
# A Dockerfile is a RECIPE that tells Docker exactly how to build
# a container image for this service. Think of it as a step-by-step
# instruction manual: "start with Node.js, copy my code, install
# dependencies, build it, then run it."
#
# MULTI-STAGE BUILD:
# We use TWO stages to keep the final image small:
#   Stage 1 (builder): Install ALL dependencies, compile TypeScript
#   Stage 2 (production): Copy ONLY the compiled output + prod deps
#
# Why? devDependencies (jest, eslint, ts-node, etc.) are only needed
# during build. The production image doesn't need them, so it's
# much smaller (saves bandwidth and startup time).
#
# BUILD CONTEXT:
# In docker-compose.yml, context is set to the project ROOT (.)
# so all COPY paths here are relative to FMS/ (the root).
# ================================================================


# ==========================
# STAGE 1: Build Stage
# ==========================
# "FROM" tells Docker which BASE IMAGE to start with.
# node:20-alpine = Node.js v20 on Alpine Linux (very small: ~50MB)
# "AS builder" gives this stage a name so we can reference it later.
FROM node:20-alpine AS builder

# WORKDIR sets the working directory INSIDE the container.
# All subsequent commands (COPY, RUN, etc.) run relative to /app.
# Think of it like "cd /app" but it also CREATES the directory.
WORKDIR /app

# COPY package*.json first (before the rest of the code).
# WHY? Docker caches each layer. If package.json hasn't changed,
# Docker skips "npm install" on rebuild — saving minutes.
# This is called "layer caching optimization."
#
# Source path is relative to the BUILD CONTEXT (project root).
COPY services/api-gateway/package*.json ./

# RUN executes a command DURING the build process.
# npm ci = "clean install" — faster and stricter than npm install.
# It uses package-lock.json exactly, ensuring reproducible builds.
RUN npm ci

# Now copy the rest of the source code.
# The order matters: package.json first, then code, so that
# code changes don't invalidate the npm install cache.
COPY services/api-gateway/ .

# Compile TypeScript → JavaScript.
# The output goes to ./dist/ (as configured in tsconfig.json).
RUN npm run build


# ==========================
# STAGE 2: Production Stage
# ==========================
# Start fresh from a clean Node.js image.
# We DON'T carry over the build tools, source code, or devDependencies.
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files again for production install
COPY services/api-gateway/package*.json ./

# Install ONLY production dependencies (no devDependencies).
# --omit=dev skips jest, eslint, typescript, etc.
# This makes the image MUCH smaller.
RUN npm ci --omit=dev

# Copy the compiled JavaScript from the builder stage.
# --from=builder means "copy from Stage 1, not from my local machine"
COPY --from=builder /app/dist ./dist

# Copy proto files — the gateway needs these at RUNTIME
# to know how to communicate with other services via gRPC.
# Source: from build context (project root), proto/ folder.
COPY proto ./proto

# EXPOSE documents which port this container listens on.
# It does NOT actually publish the port — that's done in
# docker-compose.yml with "ports: - 3000:3000".
# Think of it as documentation for other developers.
EXPOSE 3000

# CMD defines the command that runs when the container STARTS.
# ["node", "dist/main.js"] runs the compiled JavaScript.
# We use the array form (exec form) instead of shell form
# for proper signal handling (SIGTERM, SIGINT for graceful shutdown).
CMD ["node", "dist/main.js"]
