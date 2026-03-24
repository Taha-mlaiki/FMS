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
var SchemaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
/**
 * Schema Service
 *
 * Handles the physical creation and validation of PostgreSQL schemas.
 */
let SchemaService = SchemaService_1 = class SchemaService {
    constructor(baseDataSource) {
        this.baseDataSource = baseDataSource;
        this.logger = new common_1.Logger(SchemaService_1.name);
    }
    /**
     * Format a UUID into a valid PostgreSQL schema name
     * UUIDs have hyphens, which SQL doesn't like unquoted.
     * e.g., 123e4567-e89b-12d3... -> farm_123e4567_e89b_12d3...
     */
    formatSchemaName(tenantId) {
        // Validate UUID format to prevent SQL injection
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new Error(`Invalid tenant ID format: ${tenantId}. Must be a valid UUID.`);
        }
        return `farm_${tenantId.replace(/-/g, '_')}`;
    }
    /**
     * Physically create the schema in the PostgreSQL database
     */
    async createSchema(tenantId) {
        const schemaName = this.formatSchemaName(tenantId);
        this.logger.log(`Creating database schema: ${schemaName}`);
        // We must execute raw SQL to create a schema
        await this.baseDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        return schemaName;
    }
    /**
     * Delete a schema permanently (DANGER)
     */
    async dropSchema(tenantId) {
        const schemaName = this.formatSchemaName(tenantId);
        this.logger.warn(`DROPPING database schema and all data: ${schemaName}`);
        // CASCADE means all tables inside the schema will be deleted too
        await this.baseDataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
};
exports.SchemaService = SchemaService;
exports.SchemaService = SchemaService = SchemaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], SchemaService);
//# sourceMappingURL=schema.service.js.map