FROM node:20-alpine AS builder
WORKDIR /app
COPY services/report-service/package*.json ./
RUN npm ci
COPY services/report-service/ .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY services/report-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY proto ./proto
EXPOSE 50056
CMD ["node", "dist/main.js"]
