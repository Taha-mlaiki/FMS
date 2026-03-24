import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { Repository, ObjectLiteral } from 'typeorm';
import { MaterialEntity } from './entities/material.entity';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(private readonly tenantManager: TenantConnectionManager) {}

  private async getRepository(farmId: string): Promise<Repository<MaterialEntity>> {
    const connection = await this.tenantManager.getTenantConnection(farmId);
    return connection.getRepository(MaterialEntity);
  }

  async create(farmId: string, data: Partial<MaterialEntity>): Promise<MaterialEntity> {
    const repo = await this.getRepository(farmId);
    const material = repo.create(data);
    return repo.save(material);
  }

  async findById(farmId: string, id: string): Promise<MaterialEntity | null> {
    const repo = await this.getRepository(farmId);
    return repo.findOneBy({ id });
  }

  async update(
    farmId: string,
    id: string,
    data: Partial<MaterialEntity>,
  ): Promise<MaterialEntity> {
    const repo = await this.getRepository(farmId);
    await repo.update(id, data);
    const updated = await repo.findOneBy({ id });
    if (!updated) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'stock.material_not_found',
      });
    }
    return updated;
  }

  async delete(farmId: string, id: string): Promise<void> {
    const repo = await this.getRepository(farmId);
    await repo.delete(id);
  }

  async list(farmId: string, filter: any): Promise<[MaterialEntity[], number]> {
    const repo = await this.getRepository(farmId);
    const query = repo.createQueryBuilder('material');

    if (filter.category) {
      query.andWhere('material.category = :category', {
        category: filter.category,
      });
    }

    if (filter.low_stock_only) {
      query.andWhere('material.quantity <= material.min_threshold');
    }

    const skip = ((filter.page || 1) - 1) * (filter.limit || 10);
    query.skip(skip).take(filter.limit || 10);
    query.orderBy('material.created_at', 'DESC');

    return query.getManyAndCount();
  }

  async updateQuantity(farmId: string, id: string, delta: number): Promise<MaterialEntity> {
    const material = await this.findById(farmId, id);
    if (!material) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'stock.material_not_found',
      });
    }

    material.quantity += delta;
    const repo = await this.getRepository(farmId);
    return repo.save(material);
  }
}
