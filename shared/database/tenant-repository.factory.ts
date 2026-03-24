import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource, ObjectType, Repository } from 'typeorm';
import { TenantConnectionManager } from './tenant-connection.manager';

/**
 * Tenant Repository Factory
 * 
 * Injected as REQUEST scoped. It extracts the tenant ID (farm ID)
 * from the current request (set by the TenantInterceptor), grabs
 * the correct TypeORM DataSource, and then resolves standard
 * Repositories scoped to that tenant schema.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantRepositoryFactory {
    constructor(
        @Inject(REQUEST) private readonly request: Record<string, unknown>,
        private readonly connectionManager: TenantConnectionManager,
    ) { }

    /**
     * Returns a standard TypeORM repository bound to the tenant's schema.
     */
    async getRepository<T extends import('typeorm').ObjectLiteral>(entity: ObjectType<T>): Promise<Repository<T>> {
        const tenantId = this.request._tenantId as string;

        if (!tenantId) {
            throw new Error('Tenant context (x-farm-id) is missing from the request. Cannot resolve schema repository.');
        }

        const dataSource = await this.connectionManager.getTenantConnection(tenantId);

        // Return a normal repository, but from the specific tenant's DataSource
        return dataSource.getRepository(entity);
    }
}
