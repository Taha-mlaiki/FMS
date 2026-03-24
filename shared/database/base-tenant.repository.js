"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTenantRepository = void 0;
/**
 * Abstract Base Tenant Repository
 *
 * All microservice repositories should extend this class instead of
 * directly using standard TypeORM repositories. This guarantees
 * that queries are locked to the specific tenant's schema.
 */
class BaseTenantRepository {
    constructor(repository) {
        this.repository = repository;
    }
    get target() {
        return this.repository.target;
    }
    get manager() {
        return this.repository.manager;
    }
    createQueryBuilder(alias) {
        return this.repository.createQueryBuilder(alias);
    }
    create(entityLikeOrArray) {
        if (Array.isArray(entityLikeOrArray)) {
            return this.repository.create(entityLikeOrArray);
        }
        else if (entityLikeOrArray) {
            return this.repository.create(entityLikeOrArray);
        }
        return this.repository.create();
    }
    async save(entityOrEntities, options) {
        if (Array.isArray(entityOrEntities)) {
            return this.repository.save(entityOrEntities, options);
        }
        return this.repository.save(entityOrEntities, options);
    }
    async find(options) {
        return this.repository.find(options);
    }
    async findOne(options) {
        return this.repository.findOne(options);
    }
    async findOneBy(where) {
        return this.repository.findOneBy(where);
    }
    async findAndCount(options) {
        return this.repository.findAndCount(options);
    }
    async remove(entityOrEntities, options) {
        if (Array.isArray(entityOrEntities)) {
            return this.repository.remove(entityOrEntities, options);
        }
        return this.repository.remove(entityOrEntities, options);
    }
    async delete(criteria) {
        return this.repository.delete(criteria);
    }
    async update(criteria, partialEntity) {
        return this.repository.update(criteria, partialEntity);
    }
}
exports.BaseTenantRepository = BaseTenantRepository;
//# sourceMappingURL=base-tenant.repository.js.map