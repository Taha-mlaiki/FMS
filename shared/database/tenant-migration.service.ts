import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Tenant Migration Service
 * 
 * Handles running TypeORM migrations for specific tenant schemas.
 */
@Injectable()
export class TenantMigrationService {
    private readonly logger = new Logger(TenantMigrationService.name);

    /**
     * Run migrations for a specific tenant DataSource.
     * This should be called immediately after a new tenant schema is created,
     * or during application startup to catch up existing schemas.
     */
    async runMigrations(tenantDataSource: DataSource): Promise<void> {
        const schemaName = (tenantDataSource.options as any).schema as string;
        this.logger.log(`Running migrations for schema: ${schemaName}`);

        try {
            // TypeORM's runMigrations() API executes all pending migrations
            // Since this DataSource is bound to the specific schema via its options,
            // the migrations will only affect that schema.
            const migrations = await tenantDataSource.runMigrations({
                transaction: 'all' // Run in a single transaction so we can rollback if one fails
            });

            if (migrations.length > 0) {
                this.logger.log(`✅ Successfully ran ${migrations.length} migrations for ${schemaName}`);
                migrations.forEach((m: any) => this.logger.debug(` - ${m.name}`));
            } else {
                this.logger.debug(`No pending migrations for ${schemaName}`);
            }
        } catch (error) {
            this.logger.error(`❌ Failed to run migrations for ${schemaName}`, error);
            throw error;
        }
    }
}
