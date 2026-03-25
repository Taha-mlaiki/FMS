import { Injectable, Logger } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { MetricTypeEntity } from './entities/metric-type.entity';
import { MetricRecordEntity } from './entities/metric-record.entity';
import { MortalityRecordEntity } from './entities/mortality-record.entity';
import { GroupsService } from '../groups/groups.service';
import { TenantConnectionManager } from '@shared/database';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly connectionManager: TenantConnectionManager,
    private readonly groupsService: GroupsService,
  ) {}

  private async getRepo<T extends import('typeorm').ObjectLiteral>(
    farmId: string,
    entity: any,
  ): Promise<Repository<T>> {
    const connection = await this.connectionManager.getTenantConnection(farmId);
    return connection.getRepository(entity);
  }

  // --- Metric Types ---
  async createMetricType(
    farmId: string,
    data: Partial<MetricTypeEntity>,
  ): Promise<MetricTypeEntity> {
    const repo = await this.getRepo<MetricTypeEntity>(farmId, MetricTypeEntity);
    const type = repo.create(data);
    return repo.save(type);
  }

  async listMetricTypes(
    farmId: string,
    filter: any,
  ): Promise<MetricTypeEntity[]> {
    const repo = await this.getRepo<MetricTypeEntity>(farmId, MetricTypeEntity);
    return repo.find({ where: filter });
  }

  // --- Metric Recording ---
  async recordMetrics(
    farmId: string,
    groupId: string,
    entries: any[],
    recordedBy: string,
    taskId?: string,
  ): Promise<number> {
    const repo = await this.getRepo<MetricRecordEntity>(
      farmId,
      MetricRecordEntity,
    );
    let count = 0;
    for (const entry of entries) {
      const record = repo.create({
        groupId,
        metricTypeId: entry.metricTypeId,
        value: entry.value,
        recordedBy,
        taskOccurrenceId: taskId,
        recordedAt: entry.recordedAt ? new Date(entry.recordedAt) : new Date(),
      });
      await repo.save(record);
      count++;
    }
    return count;
  }

  async getMetrics(
    farmId: string,
    groupId: string,
    typeId?: string,
    start?: string,
    end?: string,
  ): Promise<MetricRecordEntity[]> {
    const repo = await this.getRepo<MetricRecordEntity>(
      farmId,
      MetricRecordEntity,
    );
    const where: any = { groupId };
    if (typeId) where.metricTypeId = typeId;
    if (start && end)
      where.recordedAt = Between(new Date(start), new Date(end));

    return repo.find({
      where,
      order: { recordedAt: 'DESC' },
    });
  }

  // --- Mortality ---
  async recordMortality(
    farmId: string,
    data: any,
  ): Promise<MortalityRecordEntity> {
    const repo = await this.getRepo<MortalityRecordEntity>(
      farmId,
      MortalityRecordEntity,
    );
    const record = repo.create({
      groupId: data.groupId,
      count: data.count,
      cause: data.cause,
      date: data.date,
      notes: data.notes,
      recordedBy: data.recordedBy,
    });

    const saved = await repo.save(record);

    // Update group quantity
    await this.groupsService.updateQuantity(farmId, data.groupId, -data.count);

    return saved;
  }

  async getMortalityHistory(
    farmId: string,
    groupId: string,
    start?: string,
    end?: string,
  ): Promise<MortalityRecordEntity[]> {
    const repo = await this.getRepo<MortalityRecordEntity>(
      farmId,
      MortalityRecordEntity,
    );
    const where: any = { groupId };
    if (start && end) where.date = Between(start, end);

    return repo.find({
      where,
      order: { date: 'DESC' },
    });
  }
}
