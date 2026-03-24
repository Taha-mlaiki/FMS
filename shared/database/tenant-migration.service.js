"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantMigrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMigrationService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Tenant Migration Service
 *
 * Handles running TypeORM migrations for specific tenant schemas.
 */
let TenantMigrationService = TenantMigrationService_1 = class TenantMigrationService {
    constructor() {
        this.logger = new common_1.Logger(TenantMigrationService_1.name);
    }
    /**
     * Run migrations for a specific tenant DataSource.
     * This should be called immediately after a new tenant schema is created,
     * or during application startup to catch up existing schemas.
     */
    async runMigrations(tenantDataSource) {
        const schemaName = tenantDataSource.options.schema;
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
                migrations.forEach((m) => this.logger.debug(` - ${m.name}`));
            }
            else {
                this.logger.debug(`No pending migrations for ${schemaName}`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to run migrations for ${schemaName}`, error);
            throw error;
        }
    }
};
exports.TenantMigrationService = TenantMigrationService;
exports.TenantMigrationService = TenantMigrationService = TenantMigrationService_1 = __decorate([
    (0, common_1.Injectable)()
], TenantMigrationService);
//# sourceMappingURL=tenant-migration.service.js.map