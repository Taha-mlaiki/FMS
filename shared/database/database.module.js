"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const tenant_connection_manager_1 = require("./tenant-connection.manager");
const schema_service_1 = require("./schema.service");
const tenant_migration_service_1 = require("./tenant-migration.service");
const tenant_repository_factory_1 = require("./tenant-repository.factory");
const cross_schema_service_1 = require("./cross-schema.service");
/**
 * Global Database Module
 *
 * Can be imported into any microservice to get access to
 * the shared multi-tenancy logic.
 */
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            tenant_connection_manager_1.TenantConnectionManager,
            schema_service_1.SchemaService,
            tenant_migration_service_1.TenantMigrationService,
            tenant_repository_factory_1.TenantRepositoryFactory,
            cross_schema_service_1.CrossSchemaService,
        ],
        exports: [
            tenant_connection_manager_1.TenantConnectionManager,
            schema_service_1.SchemaService,
            tenant_migration_service_1.TenantMigrationService,
            tenant_repository_factory_1.TenantRepositoryFactory,
            cross_schema_service_1.CrossSchemaService,
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map