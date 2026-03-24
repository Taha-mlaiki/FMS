import { Injectable, NestMiddleware } from '@nestjs/common';

import { randomUUID } from 'crypto';

/**
 * Correlation ID Middleware
 * 
 * Adds a unique correlation ID to each request for distributed tracing.
 * If the client sends an X-Correlation-ID header, it reuses that value.
 * Otherwise, it generates a new UUID.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
        const correlationId =
            (req.headers['x-correlation-id'] as string) || randomUUID();

        req.headers['x-correlation-id'] = correlationId;
        res.setHeader('X-Correlation-ID', correlationId);

        next();
    }
}
