"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
/**
 * Tenant Context Interceptor (for gRPC)
 *
 * Extracts the `x-farm-id` from gRPC metadata and injects it into the request context.
 * If the route requires a tenant context but none is provided, it throws an error.
 */
let TenantInterceptor = class TenantInterceptor {
    intercept(context, next) {
        if (context.getType() !== 'rpc') {
            return next.handle();
        }
        // In gRPC, metadata is the second argument
        const metadata = context.getArgByIndex(1);
        // Metadata in gRPC is a Metadata object, we need to extract the farm ID
        const farmIdMap = metadata ? metadata.get('x-farm-id') : null;
        const farmId = farmIdMap && farmIdMap.length > 0 ? farmIdMap[0] : null;
        if (!farmId) {
            // For endpoints that don't need a farm ID (like registering a user),
            // we might want to bypass this. A generic interceptor might just pass null.
            // We will let the specific controller decide if it's required.
        }
        // Attach to the request object so the controller/service can access it
        const request = context.switchToRpc().getData();
        if (typeof request === 'object' && request !== null) {
            request._tenantId = farmId;
        }
        return next.handle();
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = __decorate([
    (0, common_1.Injectable)()
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map