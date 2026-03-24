// ================================================================
// Main Entry Point — API Gateway
// ================================================================
// This file bootstraps the gateway and configures TWO key things:
//
// 1. Global ValidationPipe — validates ALL incoming request bodies
//    using class-validator decorators from DTOs.
//
// 2. Global Prefix '/api' — all routes start with /api
//    So: /auth/register becomes /api/auth/register
// ================================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GrpcHttpExceptionFilter } from './common/filters/grpc-http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -------------------------------------------------------
  // Global ValidationPipe — Automatic DTO Validation
  // -------------------------------------------------------
  // This tells NestJS: "For EVERY incoming request, validate
  // the body against the DTO's class-validator decorators."
  //
  // Options:
  //   whitelist: true → strips any properties NOT defined in the DTO
  //     Example: if someone sends { email, password, isAdmin: true }
  //     the isAdmin field gets silently removed (security!)
  //
  //   forbidNonWhitelisted: true → instead of silently stripping,
  //     it returns a 400 error: "property isAdmin should not exist"
  //
  //   transform: true → automatically converts plain objects to
  //     DTO class instances. This enables:
  //     - Type coercion (string "123" → number 123)
  //     - Default values in DTOs
  // -------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GrpcHttpExceptionFilter());

  // Global prefix: all routes start with /api
  app.setGlobalPrefix('api');

  app.use(cookieParser());

  // Debug request logger for terminal troubleshooting.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const authHeader = req.headers.authorization;
    const hasAuth = typeof authHeader === 'string' && authHeader.length > 0;
    const farmFromParams = req.params?.farmId;
    const farmFromQuery =
      typeof req.query?.farm_id === 'string' ? req.query.farm_id : undefined;
    const farmFromPath = req.originalUrl.match(/\/api\/farms\/([^/?]+)/)?.[1];
    const farmHint = farmFromParams ?? farmFromQuery ?? farmFromPath ?? '-';

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      console.log(
        `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${durationMs}ms | auth=${hasAuth ? 'yes' : 'no'} | farm=${String(farmHint)}`,
      );
    });

    next();
  });

  // Enable CORS for frontend communication
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // -------------------------------------------------------
  // Swagger / OpenAPI Configuration
  // -------------------------------------------------------
  // Generates interactive API documentation at /api/docs.
  // Each controller uses @ApiTags to group endpoints, and
  // DTOs use @ApiProperty to describe request/response shapes.
  // -------------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('FMS — Farm Management System API')
    .setDescription(
      `## Overview
The **Farm Management System (FMS)** API Gateway exposes a unified REST interface that proxies requests to backend gRPC microservices.

### Modules
| Module | Description |
|--------|-------------|
| **Authentication** | User registration, login, JWT-based auth |
| **Tasks Management** | Task templates, recurrence, occurrence generation & completion |
| **Production Tracking** | Animal groups, metric recording, mortality tracking |
| **Stock Management** | Materials inventory, transactions, low-stock alerts |
| **Reports & Analytics** | Field reports with workflow (draft → submit → review → resolve) |

### Authentication
All endpoints (except \`/auth/register\` and \`/auth/login\`) require a **Bearer JWT token**.
Click the **Authorize** button and paste your token to make authenticated requests.

### Pagination
List endpoints accept \`offset\` (default 0) and \`limit\` (default 10) query parameters.
All list responses include a \`total\` count for client-side pagination.`,
    )
    .setVersion('1.0.0')
    .setContact('FMS Team', '', '')
    .setLicense('UNLICENSED', '')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Enter your JWT access token obtained from /api/auth/login',
      },
      'bearer',
    )
    .addTag(
      'Authentication',
      'User registration, login, and profile management',
    )
    .addTag(
      'Tasks Management',
      'Task templates, recurrence scheduling, occurrence generation and completion',
    )
    .addTag(
      'Production Tracking',
      'Animal group CRUD, metric recording, and production analytics',
    )
    .addTag(
      'Stock Management',
      'Materials inventory, stock transactions, alerts, and analytics',
    )
    .addTag(
      'Reports & Analytics',
      'Field reports with submit/review/resolve workflow and analytics',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
    customSiteTitle: 'FMS API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
