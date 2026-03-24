import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { ReportsService } from './reports/reports.service';
import { ReportEntity } from './reports/entities/report.entity';

interface CreateReportRequest {
  farmId: string;
  createdBy: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  taskId?: string;
  groupId?: string;
  groupIds?: string[];
}

interface GetReportRequest {
  reportId: string;
  farmId: string;
}

interface UpdateReportRequest {
  reportId: string;
  farmId: string;
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  taskId?: string;
  groupId?: string;
  groupIds?: string[];
}

interface DeleteReportRequest {
  reportId: string;
  farmId: string;
}

interface ListReportsRequest {
  farmId: string;
  type?: string;
  severity?: string;
  taskId?: string;
  groupId?: string;
  groupIds?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

interface SubmitReportRequest {
  reportId: string;
  farmId: string;
  submittedBy: string;
}

interface ReviewReportRequest {
  reportId: string;
  farmId: string;
  reviewedBy: string;
  reviewNotes: string;
}

interface ResolveReportRequest {
  reportId: string;
  farmId: string;
  resolvedBy: string;
  resolutionNotes: string;
}

interface GetReportAnalyticsRequest {
  farmId: string;
  startDate?: string;
  endDate?: string;
}

@Controller()
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  private extractFarmId(data: any, metadata?: Metadata): string {
    const fromMeta = metadata?.get('farm-id')?.[0] as string | undefined;
    const farmId = fromMeta || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }
    return farmId;
  }

  private extractReportId(data: any, metadata?: Metadata): string {
    const fromMeta = metadata?.get('report-id')?.[0] as string | undefined;
    const id = fromMeta || data.reportId || data.report_id || data.id;
    if (!id) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'report_id is required',
      });
    }
    return id;
  }

  private extractUserId(data: any, metadata?: Metadata): string {
    const fromMeta = metadata?.get('user-id')?.[0] as string | undefined;
    return fromMeta || data.createdBy || data.created_by || 'unknown';
  }

  @GrpcMethod('ReportService', 'CreateReport')
  async createReport(data: CreateReportRequest, metadata?: Metadata) {
    try {
      const farmId = this.extractFarmId(data, metadata);
      const createdBy = this.extractUserId(data, metadata);
      const report = await this.reportsService.create(farmId, {
        title: data.title,
        description: data.description,
        type: data.type,
        severity: data.severity,
        createdBy,
        taskId: data.taskId || (data as any).task_id,
        groupIds: Array.isArray(data.groupIds)
          ? data.groupIds
          : data.groupId
            ? [data.groupId]
            : Array.isArray((data as any).group_ids)
              ? (data as any).group_ids
              : [],
      });
      return this.mapReport(report, farmId);
    } catch (e) {
      if (e instanceof RpcException) throw e;
      const error = e as Error;
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ReportService', 'GetReport')
  async getReport(data: GetReportRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractReportId(data, metadata);
    const report = await this.reportsService.findById(farmId, id);
    if (!report)
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Report not found',
      });
    return this.mapReport(report, farmId);
  }

  @GrpcMethod('ReportService', 'UpdateReport')
  async updateReport(data: UpdateReportRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractReportId(data, metadata);
    const mappedData: Partial<ReportEntity> = {};
    if (data.title !== undefined) mappedData.title = data.title;
    if (data.description !== undefined)
      mappedData.description = data.description;
    if (data.type !== undefined) mappedData.type = data.type;
    if (data.severity !== undefined) mappedData.severity = data.severity;
    if (data.taskId !== undefined) mappedData.taskId = data.taskId;
    if ((data as any).task_id !== undefined)
      mappedData.taskId = (data as any).task_id;
    if (data.groupIds !== undefined) mappedData.groupIds = data.groupIds;
    if ((data as any).group_ids !== undefined)
      mappedData.groupIds = (data as any).group_ids;
    if (data.groupId !== undefined) mappedData.groupIds = [data.groupId];

    const report = await this.reportsService.update(farmId, id, mappedData);
    return this.mapReport(report, farmId);
  }

  @GrpcMethod('ReportService', 'DeleteReport')
  async deleteReport(data: DeleteReportRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractReportId(data, metadata);
    await this.reportsService.delete(farmId, id);
    return { success: true, message: 'Report deleted' };
  }

  @GrpcMethod('ReportService', 'ListReports')
  async listReports(data: ListReportsRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const [reports, total] = await this.reportsService.list(farmId, data);
    return {
      reports: reports.map((r) => this.mapReport(r, farmId)),
      total,
      page: data.page || 1,
      limit: data.limit || 10,
    };
  }

  @GrpcMethod('ReportService', 'SubmitReport')
  async submitReport(data: SubmitReportRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractReportId(data, metadata);
    const report = await this.reportsService.submit(
      farmId,
      id,
      data.submittedBy || (data as any).submitted_by,
    );
    return this.mapReport(report, farmId);
  }

  @GrpcMethod('ReportService', 'ReviewReport')
  async reviewReport(data: ReviewReportRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractReportId(data, metadata);
    const report = await this.reportsService.review(
      farmId,
      id,
      data.reviewedBy || (data as any).reviewed_by,
      data.reviewNotes || (data as any).review_notes,
    );
    return this.mapReport(report, farmId);
  }

  @GrpcMethod('ReportService', 'ResolveReport')
  async resolveReport(data: ResolveReportRequest, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractReportId(data, metadata);
    const report = await this.reportsService.resolve(
      farmId,
      id,
      data.resolvedBy || (data as any).resolved_by,
      data.resolutionNotes || (data as any).resolution_notes,
    );
    return this.mapReport(report, farmId);
  }

  @GrpcMethod('ReportService', 'GetReportAnalytics')
  async getReportAnalytics(
    data: GetReportAnalyticsRequest,
    metadata?: Metadata,
  ) {
    const farmId = this.extractFarmId(data, metadata);
    return this.reportsService.getAnalytics(
      farmId,
      data.startDate,
      data.endDate,
    );
  }

  @GrpcMethod('ReportService', 'HealthCheck')
  healthCheck() {
    return { status: 'OK', service: 'Report Service' };
  }

  private mapReport(r: ReportEntity, farmId?: string) {
    const resolvedFarmId = farmId || r.farmId || '';
    return {
      id: r.id,
      farm_id: resolvedFarmId,
      created_by: r.createdBy || '',
      title: r.title || '',
      description: r.description || '',
      type: r.type || '',
      severity: r.severity || '',
      task_id: r.taskId || '',
      group_ids: Array.isArray(r.groupIds) ? r.groupIds : [],
      created_at:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : r.createdAt || new Date().toISOString(),
      updated_at:
        r.updatedAt instanceof Date
          ? r.updatedAt.toISOString()
          : r.updatedAt || new Date().toISOString(),
    };
  }
}
