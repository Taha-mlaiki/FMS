import { ObjectLiteral, Repository, SelectQueryBuilder, FindOneOptions, FindManyOptions, DeepPartial, SaveOptions, FindOptionsWhere, ObjectId } from 'typeorm';

/**
 * Abstract Base Tenant Repository
 * 
 * All microservice repositories should extend this class instead of
 * directly using standard TypeORM repositories. This guarantees
 * that queries are locked to the specific tenant's schema.
 */
export abstract class BaseTenantRepository<T extends ObjectLiteral> {

    constructor(protected readonly repository: Repository<T>) { }

    get target() {
        return this.repository.target;
    }

    get manager() {
        return this.repository.manager;
    }

    createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
        return this.repository.createQueryBuilder(alias);
    }

    create(): T;
    create(entityLikeArray: DeepPartial<T>[]): T[];
    create(entityLike: DeepPartial<T>): T;
    create(entityLikeOrArray?: DeepPartial<T> | DeepPartial<T>[]): T | T[] {
        if (Array.isArray(entityLikeOrArray)) {
            return this.repository.create(entityLikeOrArray);
        } else if (entityLikeOrArray) {
            return this.repository.create(entityLikeOrArray);
        }
        return this.repository.create();
    }

    async save<E extends DeepPartial<T>>(entity: E, options?: SaveOptions): Promise<E & T>;
    async save<E extends DeepPartial<T>>(entities: E[], options?: SaveOptions): Promise<(E & T)[]>;
    async save<E extends DeepPartial<T>>(entityOrEntities: E | E[], options?: SaveOptions): Promise<(E & T) | (E & T)[]> {
        if (Array.isArray(entityOrEntities)) {
            return this.repository.save(entityOrEntities, options) as any;
        }
        return this.repository.save(entityOrEntities, options) as any;
    }

    async find(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repository.find(options);
    }

    async findOne(options: FindOneOptions<T>): Promise<T | null> {
        return this.repository.findOne(options);
    }

    async findOneBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T | null> {
        return this.repository.findOneBy(where);
    }

    async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
        return this.repository.findAndCount(options);
    }

    async remove(entity: T, options?: SaveOptions): Promise<T>;
    async remove(entities: T[], options?: SaveOptions): Promise<T[]>;
    async remove(entityOrEntities: T | T[], options?: SaveOptions): Promise<T | T[]> {
        if (Array.isArray(entityOrEntities)) {
            return this.repository.remove(entityOrEntities, options);
        }
        return this.repository.remove(entityOrEntities, options);
    }

    async delete(criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | FindOptionsWhere<T>): Promise<import("typeorm").DeleteResult> {
        return this.repository.delete(criteria);
    }

    async update(criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | FindOptionsWhere<T>, partialEntity: any): Promise<import("typeorm").UpdateResult> {
        return this.repository.update(criteria, partialEntity);
    }
}
