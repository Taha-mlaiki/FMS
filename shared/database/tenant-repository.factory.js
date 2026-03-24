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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepositoryFactory = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const tenant_connection_manager_1 = require("./tenant-connection.manager");
/**
 * Tenant Repository Factory
 *
 * Injected as REQUEST scoped. It extracts the tenant ID (farm ID)
 * from the current request (set by the TenantInterceptor), grabs
 * the correct TypeORM DataSource, and then resolves standard
 * Repositories scoped to that tenant schema.
 */
let TenantRepositoryFactory = class TenantRepositoryFactory {
    constructor(request, connectionManager) {
        this.request = request;
        this.connectionManager = connectionManager;
    }
    /**
     * Returns a standard TypeORM repository bound to the tenant's schema.
     */
    async getRepository(entity) {
        const tenantId = this.request._tenantId;
        if (!tenantId) {
            throw new Error('Tenant context (x-farm-id) is missing from the request. Cannot resolve schema repository.');
        }
        const dataSource = await this.connectionManager.getTenantConnection(tenantId);
        // Return a normal repository, but from the specific tenant's DataSource
        return dataSource.getRepository(entity);
    }
};
exports.TenantRepositoryFactory = TenantRepositoryFactory;
exports.TenantRepositoryFactory = TenantRepositoryFactory = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [Object, tenant_connection_manager_1.TenantConnectionManager])
], TenantRepositoryFactory);
//# sourceMappingURL=tenant-repository.factory.js.map