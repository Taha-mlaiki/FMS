FROM node:20-alpine AS builder
WORKDIR /app
COPY services/stock-service/package*.json ./
RUN npm ci
COPY services/stock-service/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY services/stock-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY proto ./proto
EXPOSE 50055
CMD ["node", "dist/main.js"]
