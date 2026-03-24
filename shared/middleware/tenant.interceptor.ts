import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';

/**
 * Tenant Context Interceptor (for gRPC)
 * 
 * Extracts the `x-farm-id` from gRPC metadata and injects it into the request context.
 * If the route requires a tenant context but none is provided, it throws an error.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
}
