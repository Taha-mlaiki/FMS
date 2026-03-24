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
var TenantConnectionManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantConnectionManager = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
/**
 * Tenant Connection Manager
 *
 * Manages TypeORM DataSource instances per tenant (farm).
 * Instead of one huge database connection pool, we create
 * specific connections mapped to specific PostgreSQL schemas.
 */
let TenantConnectionManager = TenantConnectionManager_1 = class TenantConnectionManager {
    constructor(baseDataSource) {
        this.baseDataSource = baseDataSource;
        this.logger = new common_1.Logger(TenantConnectionManager_1.name);
        // Cache of existing connections: Record<SchemaName, DataSource>
        this.tenantDataSources = {};
    }
    /**
     * Get or create a DataSource for a specific tenant schema
     */
    async getTenantConnection(tenantId) {
        const schemaName = `farm_${tenantId.replace(/-/g, '_')}`;
        // 1. Check if we already have a cached connection
        if (this.tenantDataSources[schemaName]) {
            const dataSource = this.tenantDataSources[schemaName];
            if (dataSource.isInitialized) {
                return dataSource;
            }
        }
        // 2. We don't have it (or it disconnected), so create a new one
        this.logger.debug(`Creating new DataSource for schema: ${schemaName}`);
        // Copy options from the base connection (host, port, username, password, etc)
        const baseOptions = this.baseDataSource.options;
        const tenantOptions = {
            ...baseOptions,
            name: schemaName, // Use schema name as connection name
            schema: schemaName, // Force TypeORM to use this schema
        };
        const tenantDataSource = new typeorm_1.DataSource(tenantOptions);
        await tenantDataSource.initialize();
        // Cache the connection
        this.tenantDataSources[schemaName] = tenantDataSource;
        return tenantDataSource;
    }
};
exports.TenantConnectionManager = TenantConnectionManager;
exports.TenantConnectionManager = TenantConnectionManager = TenantConnectionManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], TenantConnectionManager);
//# sourceMappingURL=tenant-connection.manager.js.map