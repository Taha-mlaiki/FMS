"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FmsLogger = void 0;
const common_1 = require("@nestjs/common");
let FmsLogger = class FmsLogger {
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    log(message, context) {
        this.writeLog('INFO', message, context);
    }
    error(message, trace, context) {
        this.writeLog('ERROR', message, { ...context, trace });
    }
    warn(message, context) {
        this.writeLog('WARN', message, context);
    }
    debug(message, context) {
        this.writeLog('DEBUG', message, context);
    }
    verbose(message, context) {
        this.writeLog('VERBOSE', message, context);
    }
    writeLog(level, message, context) {
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
        }
        else if (level === 'WARN') {
            console.warn(JSON.stringify(logEntry));
        }
        else {
            console.log(JSON.stringify(logEntry));
        }
    }
};
exports.FmsLogger = FmsLogger;
exports.FmsLogger = FmsLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], FmsLogger);
//# sourceMappingURL=fms-logger.js.map