# 🚛 FMS — Fleet Management System

A microservice-based Fleet Management System with a Next.js frontend and NestJS backend services.

## Architecture

```
Next.js Frontend → API Gateway (NestJS) → Auth Service (NestJS)
    :3000              :4000                    :3001
```

## Services

| Service        | Port | Description                                    |
|----------------|------|------------------------------------------------|
| Frontend       | 3000 | Next.js + shadcn + Zustand + React Query       |
| API Gateway    | 4000 | Single entry point, forwards to microservices  |
| Auth Service   | 3001 | Registration, login, JWT tokens                |

## Request Flow Example

```
POST /api/auth/register  (from Next.js frontend)
       ↓
API Gateway (:4000) receives it
       ↓
Gateway forwards to Auth Service (:3001)
       ↓
Auth Service processes and returns JWT
       ↓
Gateway sends response back to frontend
```
