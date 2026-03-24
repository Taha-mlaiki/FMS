import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository, Between, Raw } from 'typeorm';
import { ReportEntity } from './entities/report.entity';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly tenantManager: TenantConnectionManager) {}

  private async getRepository(
    farmId: string,
  ): Promise<Repository<ReportEntity>> {
    const connection = await this.tenantManager.getTenantConnection(farmId);
    return connection.getRepository(ReportEntity);
  }

  async create(
    farmId: string,
    data: Partial<ReportEntity>,
  ): Promise<ReportEntity> {
    const repo = await this.getRepository(farmId);
    const report = repo.create({
      ...data,
      farmId,
      groupIds: Array.isArray(data.groupIds) ? data.groupIds : [],
    });
    return repo.save(report);
  }

  async findById(farmId: string, id: string): Promise<ReportEntity | null> {
    const repo = await this.getRepository(farmId);
    return repo.findOneBy({ id });
  }

  async update(
    farmId: string,
    id: string,
    data: Partial<ReportEntity>,
  ): Promise<ReportEntity> {
    const repo = await this.getRepository(farmId);
    await repo.update(id, data);
    const updated = await repo.findOneBy({ id });
    if (!updated) throw new NotFoundException('report.not_found');
    return updated;
  }

  async delete(farmId: string, id: string): Promise<void> {
    const repo = await this.getRepository(farmId);
    await repo.delete(id);
  }

  async list(farmId: string, filter: any): Promise<[ReportEntity[], number]> {
    const repo = await this.getRepository(farmId);
    const where: any = {};
    if (filter.type) where.type = filter.type;
    if (filter.severity) where.severity = filter.severity;
    if (filter.created_by) where.createdBy = filter.created_by;
    if (filter.task_id) where.taskId = filter.task_id;
    if (filter.group_id) {
      where.groupIds = Raw((alias) => `(:groupId = ANY(${alias}))`, {
        groupId: filter.group_id,
      });
    }
    if (Array.isArray(filter.group_ids) && filter.group_ids.length > 0) {
      where.groupIds = Raw((alias) => `${alias} && :groupIds`, {
        groupIds: filter.group_ids,
      });
    }
    if (filter.start_date && filter.end_date) {
      where.createdAt = Between(
        new Date(filter.start_date),
        new Date(filter.end_date),
      );
    }

    const skip = ((filter.page || 1) - 1) * (filter.limit || 10);
    return repo.findAndCount({
      where,
      skip,
      take: filter.limit || 10,
      order: { createdAt: 'DESC' },
    });
  }

  async submit(
    farmId: string,
    id: string,
    userId: string,
  ): Promise<ReportEntity> {
    return this.update(farmId, id, {
      updatedAt: new Date(),
      createdBy: userId,
    });
  }

  async review(
    farmId: string,
    id: string,
    reviewerId: string,
    notes: string,
  ): Promise<ReportEntity> {
    return this.update(farmId, id, {
      updatedAt: new Date(),
      createdBy: reviewerId,
    });
  }

  async resolve(
    farmId: string,
    id: string,
    resolverId: string,
    notes: string,
  ): Promise<ReportEntity> {
    return this.update(farmId, id, {
      updatedAt: new Date(),
      createdBy: resolverId,
    });
  }

  async getAnalytics(
    farmId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const repo = await this.getRepository(farmId);
    const reports = await repo.find({
      where:
        startDate && endDate
          ? { createdAt: Between(new Date(startDate), new Date(endDate)) }
          : {},
    });

    const total = reports.length;
    const resolved = 0; // Updated to reflect new logic
    const open = total; // Updated to reflect new logic

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    reports.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
    });

    return {
      total_reports: total,
      open_reports: total,
      resolved_reports: 0,
      avg_resolution_time_hours: 0,
      by_type: Object.entries(byType).map(([type, count]) => ({ type, count })),
      by_severity: Object.entries(bySeverity).map(([severity, count]) => ({
        severity,
        count,
      })),
      trends: [],
    };
  }
}
