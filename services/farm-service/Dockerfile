FROM node:20-alpine AS builder
WORKDIR /app
COPY services/farm-service/package*.json ./
RUN npm ci
COPY services/farm-service/ .
COPY shared /shared
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY services/farm-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY proto ./proto
EXPOSE 50052
CMD ["node", "dist/main.js"]
