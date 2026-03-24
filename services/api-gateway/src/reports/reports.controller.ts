import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  OnModuleInit,
  Inject,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { ReportServiceClient } from './reports.interface';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { SubmitReportDto } from './dto/submit-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportAnalyticsQueryDto } from './dto/report-analytics-query.dto';

@ApiTags('Reports & Analytics')
@ApiBearerAuth('bearer')
@Controller('reports')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class ReportsController implements OnModuleInit {
  private reportsService: ReportServiceClient;

  constructor(@Inject('REPORTS_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.reportsService =
      this.client.getService<ReportServiceClient>('ReportService');
  }

  private getFarmId(req: any): string {
    return (
      req.farmMembership?.farm?.id ||
      req.farmMembership?.farmId ||
      req.farmMembership?.farm_id
    );
  }

  /**
   * Proto3 silently drops fields with default values (empty strings, 0, false).
   * This ensures every report has all fields so the frontend can render reliably.
   */
  private normalizeReport(raw: any, farmId?: string): Record<string, unknown> {
    const groupIds = Array.isArray(raw.group_ids) ? raw.group_ids : [];
    return {
      id: raw.id ?? '',
      farm_id: raw.farm_id || farmId || '',
      title: raw.title ?? '',
      description: raw.description ?? '',
      type: raw.type ?? '',
      severity: raw.severity ?? '',
      created_by: raw.created_by ?? '',
      task_id: raw.task_id ?? '',
      group_ids: groupIds,
      group_id: groupIds[0] ?? raw.group_id ?? '',
      group_name: raw.group_name ?? '',
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Initialize a new field report',
    description:
      'Creates a new report in DRAFT status. Report types: INCIDENT, PROGRESS, MAINTENANCE. Severity levels: LOW, MEDIUM, HIGH, CRITICAL.',
  })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully in DRAFT status',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data — validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  async createReport(
    @Body() dto: CreateReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const result = await firstValueFrom(
      this.reportsService.createReport(
        {
          ...dto,
          farm_id: farmId,
          created_by: req.user.sub,
        },
        metadata,
      ),
    );
    return this.normalizeReport(result, farmId);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get farm report analytics',
    description:
      'Returns aggregated report statistics: total, open, resolved counts, average resolution time, breakdowns by type and severity, and trend data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report analytics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  async getAnalytics(
    @Query() query: ReportAnalyticsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    return firstValueFrom(
      this.reportsService.getReportAnalytics(
        { ...query, farm_id: farmId },
        metadata,
      ),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get details of a specific report',
    description:
      'Retrieves full details of a report including current status, reviewer notes, and resolution notes if resolved.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the report',
    example: 'report-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Report details retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('report-id', id);
    const result = await firstValueFrom(
      this.reportsService.getReport(
        { report_id: id, farm_id: farmId },
        metadata,
      ),
    );
    return this.normalizeReport(result, farmId);
  }

  @Get()
  @ApiOperation({
    summary: 'List reports with status filters',
    description:
      'Returns a paginated list of reports. Supports filtering by status (DRAFT, SUBMITTED, REVIEWED, RESOLVED), type, severity, group, and date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reports retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  async listReports(
    @Query() query: ListReportsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const limit = query.limit ?? 10;
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    let page = 1;

    if (typeof query.page === 'number') {
      page = query.page;
    } else if (typeof query.offset === 'number') {
      page = Math.floor(query.offset / limit) + 1;
    }

    const grpcQuery = {
      ...query,
      farm_id: farmId,
      page,
      limit,
      start_date: query.startDate,
      end_date: query.endDate,
    };

    const response = await firstValueFrom(
      this.reportsService.listReports(grpcQuery, metadata),
    );

    return {
      reports: Array.isArray(response.reports)
        ? response.reports.map((r) => this.normalizeReport(r, farmId))
        : [],
      total: response.total ?? 0,
      page,
      limit,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update report draft',
    description:
      'Updates a report that is still in DRAFT status. Can modify title, description, type, severity, and status.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the report to update',
    example: 'report-123',
  })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data — validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('report-id', id);
    const result = await firstValueFrom(
      this.reportsService.updateReport(
        { report_id: id, farm_id: farmId, ...dto },
        metadata,
      ),
    );
    return this.normalizeReport(result, farmId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a report',
    description:
      'Permanently removes a report from the system. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the report to delete',
    example: 'report-123',
  })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('report-id', id);
    return firstValueFrom(
      this.reportsService.deleteReport(
        { report_id: id, farm_id: farmId },
        metadata,
      ),
    );
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit report for review',
    description: 'Transitions a DRAFT report to SUBMITTED status.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the report to submit',
    example: 'report-123',
  })
  @ApiResponse({ status: 200, description: 'Report submitted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async submitReport(
    @Param('id') id: string,
    @Body() dto: SubmitReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('report-id', id);
    const result = await firstValueFrom(
      this.reportsService.submitReport(
        {
          report_id: id,
          farm_id: farmId,
          submitted_by: dto.submitted_by || req.user.sub,
        },
        metadata,
      ),
    );
    return this.normalizeReport(result, farmId);
  }

  @Post(':id/review')
  @ApiOperation({
    summary: 'Submit review for a report',
    description: 'Transitions a SUBMITTED report to REVIEWED status.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the report to review',
    example: 'report-123',
  })
  @ApiResponse({ status: 200, description: 'Report reviewed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async reviewReport(
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('report-id', id);
    const result = await firstValueFrom(
      this.reportsService.reviewReport(
        {
          report_id: id,
          farm_id: farmId,
          reviewed_by: dto.reviewed_by || req.user.sub,
          review_notes: dto.review_notes,
        },
        metadata,
      ),
    );
    return this.normalizeReport(result, farmId);
  }

  @Post(':id/resolve')
  @ApiOperation({
    summary: 'Mark report as resolved',
    description: 'Transitions a REVIEWED report to RESOLVED status.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the report to resolve',
    example: 'report-123',
  })
  @ApiResponse({ status: 200, description: 'Report resolved successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async resolveReport(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('report-id', id);
    const result = await firstValueFrom(
      this.reportsService.resolveReport(
        {
          report_id: id,
          farm_id: farmId,
          resolved_by: dto.resolved_by || req.user.sub,
          resolution_notes: dto.resolution_notes,
        },
        metadata,
      ),
    );
    return this.normalizeReport(result, farmId);
  }
}
