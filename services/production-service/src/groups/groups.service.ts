import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AnimalGroup } from './entities/group.entity';
import { TenantConnectionManager } from '@shared/database';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly connectionManager: TenantConnectionManager) {}

  private async getRepository(
    farmId: string,
  ): Promise<Repository<AnimalGroup>> {
    const connection = await this.connectionManager.getTenantConnection(farmId);
    return connection.getRepository(AnimalGroup);
  }

  async create(
    farmId: string,
    data: Partial<AnimalGroup>,
  ): Promise<AnimalGroup> {
    const repo = await this.getRepository(farmId);
    const group = repo.create(data);
    return repo.save(group);
  }

  async findById(farmId: string, id: string): Promise<AnimalGroup | null> {
    const repo = await this.getRepository(farmId);
    return repo.findOneBy({ id });
  }

  async update(
    farmId: string,
    id: string,
    data: Partial<AnimalGroup>,
  ): Promise<AnimalGroup> {
    const repo = await this.getRepository(farmId);
    const result = await repo.update(id, data);
    if (!result.affected)
      throw new NotFoundException('production.group_not_found');

    const updated = await this.findById(farmId, id);
    if (!updated) throw new NotFoundException('production.group_not_found');
    return updated;
  }

  async delete(farmId: string, id: string): Promise<void> {
    const repo = await this.getRepository(farmId);
    const result = await repo.delete(id);
    if (!result.affected)
      throw new NotFoundException('production.group_not_found');
  }

  async list(
    farmId: string,
    options: {
      where?: Partial<AnimalGroup>;
      page?: number;
      limit?: number;
    },
  ): Promise<[AnimalGroup[], number]> {
    const repo = await this.getRepository(farmId);
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.max(options.limit ?? 10, 1);

    return repo.findAndCount({
      where: options.where ?? {},
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async updateQuantity(
    farmId: string,
    id: string,
    delta: number,
  ): Promise<void> {
    const repo = await this.getRepository(farmId);
    const group = await this.findById(farmId, id);
    if (!group) throw new NotFoundException('production.group_not_found');
    group.currentQuantity += delta;
    await repo.save(group);
  }
}
