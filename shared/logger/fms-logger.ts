import { Injectable, LoggerService } from '@nestjs/common';

/**
 * Structured JSON Logger for FMS Microservices
 * 
 * Outputs logs in structured JSON format for easy parsing
 * by log aggregation tools (ELK, Datadog, etc.)
 */

export interface LogContext {
    service?: string;
    correlationId?: string;
    userId?: string;
    farmId?: string;
    [key: string]: unknown;
}

@Injectable()
export class FmsLogger implements LoggerService {
    private serviceName: string;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }

    log(message: string, context?: LogContext) {
        this.writeLog('INFO', message, context);
    }

    error(message: string, trace?: string, context?: LogContext) {
        this.writeLog('ERROR', message, { ...context, trace });
    }

    warn(message: string, context?: LogContext) {
        this.writeLog('WARN', message, context);
    }

    debug(message: string, context?: LogContext) {
        this.writeLog('DEBUG', message, context);
    }

    verbose(message: string, context?: LogContext) {
        this.writeLog('VERBOSE', message, context);
    }

    private writeLog(level: string, message: string, context?: LogContext) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            message,
            ...context,
        };

        // Output as JSON for log aggregation
        if (level === 'ERROR') {
            console.error(JSON.stringify(logEntry));
        } else if (level === 'WARN') {
            console.warn(JSON.stringify(logEntry));
        } else {
            console.log(JSON.stringify(logEntry));
        }
    }
}
