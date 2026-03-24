import { Global, Module } from '@nestjs/common';
import { TenantConnectionManager } from './tenant-connection.manager';
import { SchemaService } from './schema.service';
import { TenantMigrationService } from './tenant-migration.service';
import { TenantRepositoryFactory } from './tenant-repository.factory';
import { CrossSchemaService } from './cross-schema.service';

/**
 * Global Database Module
 * 
 * Can be imported into any microservice to get access to
 * the shared multi-tenancy logic.
 */
@Global()
@Module({
    providers: [
        TenantConnectionManager,
        SchemaService,
        TenantMigrationService,
        TenantRepositoryFactory,
        CrossSchemaService,
    ],
    exports: [
        TenantConnectionManager,
        SchemaService,
        TenantMigrationService,
        TenantRepositoryFactory,
        CrossSchemaService,
    ],
})
export class DatabaseModule { }
