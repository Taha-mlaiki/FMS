# API Gateway

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the Service](#running-the-service)
- [Authentication & Authorization](#authentication--authorization)
  - [JWT Flow](#jwt-flow)
  - [Public vs Protected Routes](#public-vs-protected-routes)
- [API Reference](#api-reference)
  - [Auth Endpoints](#auth-endpoints)
  - [Tasks Endpoints](#tasks-endpoints)
  - [Production Endpoints](#production-endpoints)
  - [Stock Endpoints](#stock-endpoints)
  - [Reports Endpoints](#reports-endpoints)
- [Swagger / OpenAPI](#swagger--openapi)
- [gRPC Integration](#grpc-integration)
  - [Service Connections](#service-connections)
  - [Proto Definitions](#proto-definitions)
- [DTOs & Validation](#dtos--validation)
- [Docker](#docker)
  - [Dockerfile](#dockerfile)
  - [Docker Compose](#docker-compose)
- [Testing](#testing)
- [Scripts](#scripts)

---

## Overview

The **API Gateway** is the single public-facing HTTP entry point for the Farm Management System (FMS). It receives REST requests from the Next.js frontend (or any HTTP client), authenticates them via JWT, and proxies each call to the appropriate backend microservice over **gRPC**.

It does **not** own a database — all persistence is handled by the downstream services (`user-service`, `task-service`, `production-service`, `stock-service`, `report-service`).

---

## Architecture

```
┌─────────────┐       HTTP (REST)        ┌──────────────────┐
│   Frontend   │ ─────────────────────►  │   API Gateway    │
│  (Next.js)   │ ◄─────────────────────  │   (NestJS)       │
└─────────────┘       JSON responses     │   Port 3001      │
                                         └──────┬───────────┘
                                                │  gRPC
                    ┌───────────────────────────┼───────────────────────────┐
                    │               │           │           │               │
              ┌─────▼─────┐  ┌─────▼─────┐ ┌───▼───┐ ┌────▼────┐  ┌──────▼──────┐
              │   User     │  │   Task    │ │ Prod. │ │  Stock  │  │   Report    │
              │  Service   │  │  Service  │ │Service│ │ Service │  │   Service   │
              │  :50052    │  │  :50053   │ │:50054 │ │  :50055 │  │   :50056    │
              └────────────┘  └───────────┘ └───────┘ └─────────┘  └─────────────┘
```

**Key responsibilities:**

| Responsibility        | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| **Routing**           | Maps REST endpoints to gRPC service methods                       |
| **Authentication**    | Verifies JWT tokens via a global guard                            |
| **Validation**        | Validates request bodies/query params with `class-validator` DTOs |
| **API Documentation** | Auto-generates Swagger/OpenAPI at `/api/docs`                     |
| **CORS**              | Enabled globally for cross-origin frontend requests               |

---

## Technology Stack

| Technology                               | Purpose                                     |
| ---------------------------------------- | ------------------------------------------- |
| **NestJS 11**                            | Application framework                       |
| **@nestjs/microservices**                | gRPC client connections to backend services |
| **@grpc/grpc-js + @grpc/proto-loader**   | gRPC transport layer                        |
| **@nestjs/jwt**                          | JWT token verification                      |
| **@nestjs/swagger + swagger-ui-express** | Auto-generated API docs                     |
| **class-validator + class-transformer**  | Request DTO validation & transformation     |
| **@nestjs/config**                       | Environment variable management             |
| **TypeScript 5**                         | Language                                    |
| **Jest 30**                              | Unit & E2E testing                          |
| **Docker (multi-stage)**                 | Containerised deployment                    |

---

## Project Structure

```
services/api-gateway/
├── src/
│   ├── main.ts                          # Bootstrap, Swagger setup, global pipes
│   ├── app.module.ts                    # Root module — imports all feature modules
│   ├── app.controller.ts               # Health-check / hello route
│   ├── app.service.ts                  # Simple service for app controller
│   │
│   ├── guards/
│   │   └── jwt-auth.guard.ts           # Global JWT authentication guard
│   │
│   ├── auth/
│   │   ├── auth.module.ts              # Registers USER_SERVICE gRPC client + JWT
│   │   ├── auth.controller.ts          # /api/auth/* endpoints
│   │   ├── auth.service.ts             # Proxies auth calls to User gRPC service
│   │   ├── public.decorator.ts         # @Public() decorator to skip auth
│   │   └── dto/
│   │       ├── register.dto.ts         # Registration request validation
│   │       └── login.dto.ts            # Login request validation
│   │
│   ├── tasks/
│   │   ├── tasks.module.ts             # Registers TASKS_SERVICE gRPC client
│   │   ├── tasks.controller.ts         # /api/tasks/* endpoints
│   │   ├── tasks.interface.ts          # TypeScript interfaces for gRPC client
│   │   └── dto/
│   │       ├── create-template.dto.ts  # Task template creation validation
│   │       ├── generate-occurrences.dto.ts  # Occurrence generation validation
│   │       └── complete-task.dto.ts    # Task completion validation
│   │
│   ├── production/
│   │   ├── production.module.ts        # Registers PRODUCTION_SERVICE gRPC client
│   │   ├── production.controller.ts    # /api/production/* endpoints
│   │   ├── production.interface.ts     # TypeScript interfaces for gRPC client
│   │   └── dto/
│   │       ├── create-group.dto.ts     # Animal group creation validation
│   │       ├── update-group.dto.ts     # Animal group update validation
│   │       └── record-metrics.dto.ts   # Production metrics validation
│   │
│   ├── stock/
│   │   ├── stock.module.ts             # Registers STOCK_SERVICE gRPC client
│   │   ├── stock.controller.ts         # /api/stock/* endpoints
│   │   ├── stock.interface.ts          # TypeScript interfaces for gRPC client
│   │   └── dto/
│   │       ├── create-material.dto.ts  # Material creation validation
│   │       ├── update-material.dto.ts  # Material update validation
│   │       └── create-transaction.dto.ts  # Stock transaction validation
│   │
│   ├── reports/
│   │   ├── reports.module.ts           # Registers REPORTS_SERVICE gRPC client
│   │   ├── reports.controller.ts       # /api/reports/* endpoints
│   │   ├── reports.interface.ts        # TypeScript interfaces for gRPC client
│   │   └── dto/
│   │       ├── create-report.dto.ts    # Report creation validation
│   │       └── update-report.dto.ts    # Report update validation
│   │
│   └── shared/
│       └── dto/
│           └── base-query.dto.ts       # Reusable pagination DTO (farm_id, offset, limit)
│
├── test/                               # E2E tests
├── proto/  (copied at build time)      # gRPC proto definitions
├── .env                                # Local environment variables
├── Dockerfile                          # Multi-stage Docker build
├── nest-cli.json                       # NestJS CLI configuration
├── tsconfig.json                       # TypeScript compiler options
├── tsconfig.build.json                 # TypeScript build-specific config
└── package.json                        # Dependencies & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- The `proto/` directory at the project root containing all `.proto` files
- Backend gRPC services running (or use Docker Compose to start everything)

### Environment Variables

Create a `.env` file (one is already provided) with the following variables:

| Variable              | Default             | Description                      |
| --------------------- | ------------------- | -------------------------------- |
| `PORT`                | `3001`              | HTTP port the gateway listens on |
| `JWT_SECRET`          | `super-secret-key`  | Secret used to verify JWT tokens |
| `USER_GRPC_URL`       | `localhost:50051`   | User service gRPC address        |
| `TASKS_GRPC_URL`      | `localhost:50053`   | Task service gRPC address        |
| `PRODUCTION_GRPC_URL` | `localhost:50054`   | Production service gRPC address  |
| `STOCK_GRPC_URL`      | `localhost:50055`   | Stock service gRPC address       |
| `REPORTS_GRPC_URL`    | `localhost:50056`   | Report service gRPC address      |
| `PROTO_PATH`          | `../../../../proto` | Relative path to proto directory |

### Installation

```bash
cd services/api-gateway
npm install
```

### Running the Service

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The gateway starts at `http://localhost:3001`. All routes are prefixed with `/api`.

---

## Authentication & Authorization

### JWT Flow

1. **Client** calls `POST /api/auth/login` (or `/register`) — these are public routes.
2. **API Gateway** forwards the request to the **User Service** over gRPC.
3. User Service validates credentials, creates JWT tokens, and returns them.
4. Gateway responds with `{ accessToken, refreshToken, user, currentFarm }`.
5. For subsequent requests, the client includes `Authorization: Bearer <accessToken>`.
6. The global `JwtAuthGuard` intercepts every request, verifies the token, and attaches the decoded payload (`sub`, `email`, `iat`, `exp`) to `request.user`.

### Public vs Protected Routes

- **All routes are protected by default** — the `JwtAuthGuard` is registered as a global `APP_GUARD`.
- To make a route public, apply the `@Public()` decorator (sets `isPublic` metadata).
- Currently public routes: `POST /api/auth/register`, `POST /api/auth/login`.

```typescript
// Usage example
@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

### JwtPayload Shape

```typescript
interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  iat: number; // Issued-at timestamp
  exp: number; // Expiration timestamp
}
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

### Auth Endpoints

| Method | Path                 | Auth   | Description                                    |
| ------ | -------------------- | ------ | ---------------------------------------------- |
| `POST` | `/api/auth/register` | Public | Register a new user account                    |
| `POST` | `/api/auth/login`    | Public | Authenticate and receive JWT tokens            |
| `GET`  | `/api/auth/profile`  | Bearer | Get the currently authenticated user's profile |

#### `POST /api/auth/register`

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "currentFarm": {
    "id": "uuid",
    "name": "My Farm",
    "schemaName": "farm_xxx",
    "status": "active"
  }
}
```

#### `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (200):** Same shape as register response.

#### `GET /api/auth/profile`

**Response (200):**

```json
{
  "message": "You have access to this protected route!",
  "user": {
    "sub": "user-uuid",
    "email": "john.doe@example.com",
    "iat": 1710000000,
    "exp": 1710086400
  }
}
```

---

### Tasks Endpoints

| Method   | Path                                             | Description                               |
| -------- | ------------------------------------------------ | ----------------------------------------- |
| `POST`   | `/api/tasks/templates`                           | Create a new task template                |
| `GET`    | `/api/tasks/templates/:id?farm_id=`              | Get a single task template                |
| `GET`    | `/api/tasks/templates?farm_id=&offset=&limit=`   | List task templates                       |
| `DELETE` | `/api/tasks/templates/:id?farm_id=`              | Delete a task template                    |
| `POST`   | `/api/tasks/occurrences/generate`                | Generate task occurrences from a template |
| `GET`    | `/api/tasks/occurrences/:id?farm_id=`            | Get a single task occurrence              |
| `GET`    | `/api/tasks/occurrences?farm_id=&offset=&limit=` | List task occurrences                     |
| `POST`   | `/api/tasks/occurrences/:id/complete`            | Mark a task occurrence as completed       |

#### `POST /api/tasks/templates`

**Request Body:**

```json
{
  "title": "Morning Milking",
  "description": "Ensure all cows are milked and equipment is cleaned",
  "category": "Dairy",
  "frequency": "Daily",
  "recurrence_rule": "FREQ=DAILY;INTERVAL=1",
  "assigned_role": "Worker",
  "farm_id": "farm-123",
  "is_active": true
}
```

#### `POST /api/tasks/occurrences/generate`

**Request Body:**

```json
{
  "template_id": "template-123",
  "start_date": "2026-03-01T00:00:00Z",
  "end_date": "2026-04-01T00:00:00Z",
  "farm_id": "farm-123"
}
```

#### `POST /api/tasks/occurrences/:id/complete`

**Request Body:**

```json
{
  "occurrence_id": "occ-123",
  "notes": "All went well",
  "completion_data": { "weight": 50, "temperature": 22 }
}
```

---

### Production Endpoints

| Method   | Path                                         | Description                                     |
| -------- | -------------------------------------------- | ----------------------------------------------- |
| `POST`   | `/api/production/groups`                     | Create a new animal group                       |
| `GET`    | `/api/production/groups/:id?farm_id=`        | Get animal group details                        |
| `GET`    | `/api/production/groups?farm_id=`            | List animal groups for a farm                   |
| `PUT`    | `/api/production/groups/:id`                 | Update animal group information                 |
| `DELETE` | `/api/production/groups/:id?farm_id=`        | Delete an animal group                          |
| `POST`   | `/api/production/metrics`                    | Record group metrics (weight, mortality, count) |
| `GET`    | `/api/production/metrics?farm_id=&group_id=` | List production metrics history                 |

#### `POST /api/production/groups`

**Request Body:**

```json
{
  "name": "Cattle Group A",
  "species": "Cattle",
  "breed": "Holstein",
  "arrival_date": "2026-01-15T00:00:00Z",
  "initial_quantity": 50,
  "farm_id": "farm-123"
}
```

#### `POST /api/production/metrics`

**Request Body:**

```json
{
  "group_id": "group-123",
  "type": "WEIGHT",
  "value": 450.5,
  "unit": "kg",
  "farm_id": "farm-123"
}
```

Supported metric types: `WEIGHT`, `MORTALITY`, `COUNT`, `FEED_CONSUMPTION`.

---

### Stock Endpoints

| Method   | Path                                | Description                       |
| -------- | ----------------------------------- | --------------------------------- |
| `POST`   | `/api/stock/materials`              | Create a new stock material       |
| `GET`    | `/api/stock/materials/:id?farm_id=` | Get material details              |
| `PUT`    | `/api/stock/materials/:id`          | Update material basic info        |
| `DELETE` | `/api/stock/materials/:id`          | Remove a material from the system |
| `GET`    | `/api/stock/materials?farm_id=`     | List all stock materials          |
| `POST`   | `/api/stock/transactions`           | Record a stock transaction        |
| `GET`    | `/api/stock/transactions?farm_id=`  | List stock transaction history    |
| `GET`    | `/api/stock/alerts?farm_id=`        | Get low stock alerts for a farm   |
| `GET`    | `/api/stock/analytics?farm_id=`     | Get stock consumption statistics  |

#### `POST /api/stock/materials`

**Request Body:**

```json
{
  "name": "NPK Fertilizer",
  "category": "Fertilizer",
  "quantity": 100,
  "unit": "kg",
  "min_threshold": 20,
  "farm_id": "farm-123"
}
```

#### `POST /api/stock/transactions`

**Request Body:**

```json
{
  "material_id": "mat-123",
  "type": "PURCHASE",
  "quantity": 50,
  "farm_id": "farm-123",
  "notes": "Restocking for spring season"
}
```

Supported transaction types: `PURCHASE`, `CONSUMPTION`, `ADJUSTMENT`.

---

### Reports Endpoints

| Method   | Path                                  | Description                      |
| -------- | ------------------------------------- | -------------------------------- |
| `POST`   | `/api/reports`                        | Create a new field report        |
| `GET`    | `/api/reports/:id?farm_id=`           | Get report details               |
| `GET`    | `/api/reports?farm_id=&status=&type=` | List reports with filters        |
| `PUT`    | `/api/reports/:id`                    | Update a report draft            |
| `DELETE` | `/api/reports/:id`                    | Delete a report                  |
| `POST`   | `/api/reports/:id/submit`             | Submit a report for review       |
| `POST`   | `/api/reports/:id/review`             | Submit a review for a report     |
| `POST`   | `/api/reports/:id/resolve`            | Mark a report as resolved        |
| `GET`    | `/api/reports/analytics?farm_id=`     | Get report performance analytics |

#### `POST /api/reports`

**Request Body:**

```json
{
  "title": "Broken Fence Sector 4",
  "description": "The perimeter fence in sector 4 is damaged and needs immediate repair.",
  "type": "INCIDENT",
  "severity": "MEDIUM",
  "farm_id": "farm-123"
}
```

Supported report types: `INCIDENT`, `PROGRESS`, `MAINTENANCE`.
Supported severity levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

**Report Workflow:**
`DRAFT` → `SUBMITTED` → `REVIEWED` → `RESOLVED`

---

## Swagger / OpenAPI

Swagger UI is auto-generated and available at:

```
http://localhost:3001/api/docs
```

It is configured in `main.ts` using `@nestjs/swagger`:

- **Title:** FMS API Gateway
- **Version:** 1.0
- **Auth:** Bearer token (click "Authorize" in the Swagger UI and paste your JWT)

All controllers use `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiBearerAuth` decorators to provide rich documentation.

---

## gRPC Integration

The API Gateway communicates with all backend services via **gRPC** using `@nestjs/microservices` with `Transport.GRPC`.

### Service Connections

| gRPC Client Name     | Target Service     | Default URL       | Proto Package | Proto File         |
| -------------------- | ------------------ | ----------------- | ------------- | ------------------ |
| `USER_SERVICE`       | user-service       | `localhost:50052` | `user`        | `user.proto`       |
| `TASKS_SERVICE`      | task-service       | `localhost:50053` | `task`        | `task.proto`       |
| `PRODUCTION_SERVICE` | production-service | `localhost:50054` | `production`  | `production.proto` |
| `STOCK_SERVICE`      | stock-service      | `localhost:50055` | `stock`       | `stock.proto`      |
| `REPORTS_SERVICE`    | report-service     | `localhost:50056` | `report`      | `report.proto`     |

Each module registers its gRPC client via `ClientsModule.register()` and obtains the service stub in `onModuleInit()` using `client.getService<T>('ServiceName')`. All gRPC calls return RxJS `Observable`s, converted to `Promise`s with `firstValueFrom()`.

### Proto Definitions

Proto files are located at the project root (`proto/`). During Docker build they are copied into the container. In local development, they are resolved via relative paths (e.g., `../../../../proto/task.proto`).

Each proto file defines:

- **Service RPCs** — the methods the gateway can call
- **Request / Response messages** — the data shapes sent over the wire

---

## DTOs & Validation

The gateway uses **class-validator** and **class-transformer** for request validation. A global `ValidationPipe` is configured in `main.ts` with:

```typescript
new ValidationPipe({
  whitelist: true, // Strip properties not in the DTO
  forbidNonWhitelisted: true, // Throw if unknown properties are sent
  transform: true, // Auto-transform payloads to DTO instances
});
```

### Available DTOs

| Module     | DTO                      | Purpose                                                                  |
| ---------- | ------------------------ | ------------------------------------------------------------------------ |
| Auth       | `RegisterDto`            | Validates registration (firstName, lastName, email, password >= 6 chars) |
| Auth       | `LoginDto`               | Validates login (email, password)                                        |
| Tasks      | `CreateTemplateDto`      | Validates task template creation                                         |
| Tasks      | `GenerateOccurrencesDto` | Validates occurrence generation (template_id, date range, farm_id)       |
| Tasks      | `CompleteTaskDto`        | Validates task completion (occurrence_id, optional notes & data)         |
| Production | `CreateGroupDto`         | Validates animal group creation                                          |
| Production | `UpdateGroupDto`         | Validates partial group updates                                          |
| Production | `RecordMetricsDto`       | Validates metric recording (enum type, value, unit)                      |
| Stock      | `CreateMaterialDto`      | Validates material creation                                              |
| Stock      | `UpdateMaterialDto`      | Validates partial material updates                                       |
| Stock      | `CreateTransactionDto`   | Validates stock transactions (enum type, quantity)                       |
| Reports    | `CreateReportDto`        | Validates report creation (enum type & severity)                         |
| Reports    | `UpdateReportDto`        | Validates partial report updates                                         |
| Shared     | `BaseQueryDto`           | Reusable pagination (farm_id, offset, limit)                             |

---

## Docker

### Dockerfile

The gateway uses a **multi-stage build** for minimal production image size:

| Stage          | Base Image       | Purpose                                                  |
| -------------- | ---------------- | -------------------------------------------------------- |
| **builder**    | `node:20-alpine` | Install all dependencies, compile TypeScript             |
| **production** | `node:20-alpine` | Copy only `dist/` + production deps, copy `proto/` files |

```dockerfile
# Stage 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm ci
COPY services/api-gateway/ .
RUN npm run build

# Stage 2 — Production
FROM node:20-alpine AS production
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY proto ./proto
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

> **Note:** The build context in `docker-compose.yml` is the project root (`.`), so all `COPY` paths are relative to `FMS/`.

### Docker Compose

In `docker-compose.yml` the gateway is configured as:

```yaml
api-gateway:
  build:
    context: .
    dockerfile: services/api-gateway/Dockerfile
  ports:
    - '3001:3001'
  environment:
    - PORT=3001
    - USER_GRPC_URL=user-service:50051
    - TASKS_GRPC_URL=task-service:50053
    - PRODUCTION_GRPC_URL=production-service:50054
    - STOCK_GRPC_URL=stock-service:50055
    - REPORTS_GRPC_URL=report-service:50056
    - JWT_SECRET=${JWT_SECRET}
    - PROTO_PATH=../../proto
  depends_on:
    - auth-service
    - user-service
    - task-service
    - production-service
    - stock-service
    - report-service
```

Start everything with:

```bash
docker compose up --build
```

---

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

E2E test configuration is in `test/jest-e2e.json`.

---

## Scripts

| Script        | Command                                         | Description                      |
| ------------- | ----------------------------------------------- | -------------------------------- |
| `build`       | `nest build`                                    | Compile TypeScript to `dist/`    |
| `start`       | `nest start`                                    | Start the application            |
| `start:dev`   | `nest start --watch`                            | Start in watch mode (hot-reload) |
| `start:debug` | `nest start --debug --watch`                    | Start with debugger attached     |
| `start:prod`  | `node dist/main`                                | Start from compiled output       |
| `format`      | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Format code with Prettier        |
| `lint`        | `eslint "{src,apps,libs,test}/**/*.ts" --fix`   | Lint & auto-fix code             |
| `test`        | `jest`                                          | Run unit tests                   |
| `test:watch`  | `jest --watch`                                  | Run tests in watch mode          |
| `test:cov`    | `jest --coverage`                               | Run tests with coverage report   |
| `test:debug`  | `node --inspect-brk ... jest --runInBand`       | Debug tests                      |
| `test:e2e`    | `jest --config ./test/jest-e2e.json`            | Run end-to-end tests             |
