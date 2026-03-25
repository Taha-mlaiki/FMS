import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FarmAccessService } from '../auth/farm-access.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { ReportServiceClient } from '../reports/reports.interface';
import { StockServiceClient } from '../stock/stock.interface';
import { Task, TaskServiceClient } from '../tasks/tasks.interface';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';

type ReportItem = { created_by?: string; status?: string };
type TaskListResponse = {
  tasks?: Task[];
  total?: number;
};
type ReportListResponse = {
  reports?: ReportItem[];
  total?: number;
};
type StockAlertsResponse = {
  alerts?: unknown[];
};
type DashboardPeriod = 'day' | 'week' | 'month' | 'year';

@Controller('farms/:farmId/dashboard')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class DashboardController implements OnModuleInit {
  private tasksService!: TaskServiceClient;
  private reportsService!: ReportServiceClient;
  private stockService!: StockServiceClient;

  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientGrpc,
    @Inject('REPORTS_SERVICE') private readonly reportsClient: ClientGrpc,
    @Inject('STOCK_SERVICE') private readonly stockClient: ClientGrpc,
    private readonly farmAccessService: FarmAccessService,
    private readonly authService: AuthService,
  ) {}

  onModuleInit() {
    this.tasksService =
      this.tasksClient.getService<TaskServiceClient>('TaskService');
    this.reportsService =
      this.reportsClient.getService<ReportServiceClient>('ReportService');
    this.stockService =
      this.stockClient.getService<StockServiceClient>('StockService');
  }

  private async listAllTasks(
    query: Record<string, unknown>,
    metadata?: any,
  ): Promise<Task[]> {
    const pageSize = 100;
    const farmIdFromQuery = this.getStringAlias(query, 'farmId', 'farm_id');
    const workerIdFromQuery = this.getStringAlias(
      query,
      'workerId',
      'worker_id',
    );
    const groupIdFromQuery = this.getStringAlias(query, 'groupId', 'group_id');
    const startDateFromQuery = this.getStringAlias(
      query,
      'startDate',
      'start_date',
    );
    const endDateFromQuery = this.getStringAlias(query, 'endDate', 'end_date');

    const firstPageRaw = await firstValueFrom(
      this.tasksService.listTasks(
        {
          ...query,
          farmId: farmIdFromQuery,
          farm_id: farmIdFromQuery,
          workerId: workerIdFromQuery,
          worker_id: workerIdFromQuery,
          groupId: groupIdFromQuery,
          group_id: groupIdFromQuery,
          startDate: startDateFromQuery,
          start_date: startDateFromQuery,
          endDate: endDateFromQuery,
          end_date: endDateFromQuery,
          page: 1,
          limit: pageSize,
        },
        metadata,
      ),
    );

    const firstPage = firstPageRaw as TaskListResponse;
    const firstItems = firstPage.tasks ?? [];
    const total = firstPage.total ?? firstItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (totalPages === 1) {
      return firstItems;
    }

    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        firstValueFrom(
          this.tasksService.listTasks(
            {
              ...query,
              farmId: farmIdFromQuery,
              farm_id: farmIdFromQuery,
              workerId: workerIdFromQuery,
              worker_id: workerIdFromQuery,
              groupId: groupIdFromQuery,
              group_id: groupIdFromQuery,
              startDate: startDateFromQuery,
              start_date: startDateFromQuery,
              endDate: endDateFromQuery,
              end_date: endDateFromQuery,
              page: index + 2,
              limit: pageSize,
            },
            metadata,
          ),
        ),
      ),
    );

    const restItems = restPages.flatMap(
      (page) => (page as TaskListResponse).tasks ?? [],
    );

    return [...firstItems, ...restItems];
  }

  private async countTasks(
    query: Record<string, unknown>,
    metadata?: any,
  ): Promise<number> {
    const farmIdFromQuery = this.getStringAlias(query, 'farmId', 'farm_id');
    const workerIdFromQuery = this.getStringAlias(
      query,
      'workerId',
      'worker_id',
    );

    const firstPageRaw = await firstValueFrom(
      this.tasksService.listTasks(
        {
          ...query,
          farmId: farmIdFromQuery,
          farm_id: farmIdFromQuery,
          workerId: workerIdFromQuery,
          worker_id: workerIdFromQuery,
          page: 1,
          limit: 1,
        },
        metadata,
      ),
    );

    const firstPage = firstPageRaw as TaskListResponse;
    return firstPage.total ?? 0;
  }

  private getStringAlias(
    query: Record<string, unknown>,
    camelKey: string,
    snakeKey: string,
  ): string | undefined {
    const camelValue = query[camelKey];
    if (typeof camelValue === 'string' && camelValue.length > 0) {
      return camelValue;
    }

    const snakeValue = query[snakeKey];
    if (typeof snakeValue === 'string' && snakeValue.length > 0) {
      return snakeValue;
    }

    return undefined;
  }

  private async listAllReports(
    query: Record<string, unknown>,
    metadata?: any,
  ): Promise<ReportItem[]> {
    const pageSize = 100;
    const firstPageRaw = await firstValueFrom(
      this.reportsService.listReports(
        { ...query, page: 1, limit: pageSize },
        metadata,
      ),
    );

    const firstPage = firstPageRaw as ReportListResponse;
    const firstItems = firstPage.reports ?? [];
    const total = firstPage.total ?? firstItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (totalPages === 1) {
      return firstItems;
    }

    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        firstValueFrom(
          this.reportsService.listReports(
            {
              ...query,
              page: index + 2,
              limit: pageSize,
            },
            metadata,
          ),
        ),
      ),
    );

    const restItems = restPages.flatMap(
      (page) => (page as ReportListResponse).reports ?? [],
    );

    return [...firstItems, ...restItems];
  }

  private resolveDateRange(period: DashboardPeriod): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    const start = new Date(now);

    if (period === 'day') {
      start.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else {
      start.setFullYear(now.getFullYear() - 1);
    }

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate,
    };
  }

  private sanitizePeriod(value?: string): DashboardPeriod {
    if (
      value === 'day' ||
      value === 'week' ||
      value === 'month' ||
      value === 'year'
    ) {
      return value;
    }

    return 'week';
  }

  private async countAllReportsByUser(
    farmId: string,
    userId: string,
    metadata?: any,
  ): Promise<number> {
    const pageSize = 100;
    const firstPageRaw = await firstValueFrom(
      this.reportsService.listReports(
        {
          farm_id: farmId,
          page: 1,
          limit: pageSize,
        },
        metadata,
      ),
    );

    const firstPage = firstPageRaw as ReportListResponse;
    const firstReports = firstPage.reports ?? [];
    const total = firstPage.total ?? firstReports.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    let count = firstReports.filter(
      (report) => report.created_by === userId,
    ).length;

    if (totalPages === 1) {
      return count;
    }

    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        firstValueFrom(
          this.reportsService.listReports(
            {
              farm_id: farmId,
              page: index + 2,
              limit: pageSize,
            },
            metadata,
          ),
        ),
      ),
    );

    for (const page of restPages) {
      const reports = (page as ReportListResponse).reports ?? [];
      count += reports.filter((report) => report.created_by === userId).length;
    }

    return count;
  }

  @Get('worker')
  async getWorkerDashboard(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    const [
      todayTasks,
      recentCompletions,
      myReportsCount,
      totalCompletedTasks,
      totalSkippedTasks,
      totalTasks,
      myFarmsRaw,
    ] = await Promise.all([
      this.listAllTasks(
        {
          farmId,
          farm_id: farmId,
          workerId: userId,
          worker_id: userId,
          startDate: todayIso,
          start_date: todayIso,
          endDate: todayIso,
          end_date: todayIso,
        },
        metadata,
      ),
      this.listAllTasks(
        {
          farmId,
          farm_id: farmId,
          workerId: userId,
          worker_id: userId,
          status: 'completed',
          startDate: lastWeek,
          start_date: lastWeek,
          endDate: todayIso,
          end_date: todayIso,
        },
        metadata,
      ),
      this.countAllReportsByUser(farmId, userId, metadata),
      this.countTasks(
        {
          farmId,
          farm_id: farmId,
          workerId: userId,
          worker_id: userId,
          status: 'completed',
        },
        metadata,
      ),
      this.countTasks(
        {
          farmId,
          farm_id: farmId,
          workerId: userId,
          worker_id: userId,
          status: 'skipped',
        },
        metadata,
      ),
      this.countTasks(
        { farmId, farm_id: farmId, workerId: userId, worker_id: userId },
        metadata,
      ),
      this.authService.listUserFarms(userId, { suppressErrors: true }),
    ]);

    return {
      todayTasks,
      recentCompletions,
      myReportsCount,
      totalCompletedTasks,
      totalSkippedTasks,
      totalTasks,
      myFarmsCount: myFarmsRaw.length,
    };
  }

  @Get('owner')
  async getOwnerDashboard(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query('period') rawPeriod?: string,
  ) {
    const period = this.sanitizePeriod(rawPeriod);
    const { startDate, endDate } = this.resolveDateRange(period);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    const [
      occurrences,
      reports,
      alertsResponse,
      membersRaw,
      templatesRaw,
      absoluteTasksResp,
    ] = await Promise.all([
      this.listAllTasks(
        {
          farm_id: farmId,
          farmId,
          start_date: startDate,
          end_date: endDate,
        },
        metadata,
      ),
      this.listAllReports(
        {
          farm_id: farmId,
          start_date: startDate,
          end_date: endDate,
        },
        metadata,
      ),
      firstValueFrom(
        this.stockService.getLowStockAlerts({ farm_id: farmId }, metadata),
      )
        .then((result) => result as StockAlertsResponse)
        .catch(() => ({ alerts: [] as unknown[] })),
      this.authService
        .listFarmMembers(farmId, req.user.sub, { limit: 1 })
        .catch(() => ({ total: 0 })),
      firstValueFrom(
        this.tasksService.listTaskTemplates(
          { farmId, farm_id: farmId, isActive: true },
          metadata,
        ),
      ).catch(() => ({ templates: [] })),
      firstValueFrom(
        this.tasksService.listTasks(
          { farmId, farm_id: farmId, limit: 1 },
          metadata,
        ),
      ).catch(() => ({ total: 0 })),
    ]);

    const todo = occurrences.filter((item) => item.status === 'todo').length;
    const pending = occurrences.filter(
      (item) => item.status === 'pending',
    ).length;
    const completed = occurrences.filter(
      (item) => item.status === 'completed',
    ).length;
    const skipped = occurrences.filter(
      (item) => item.status === 'skipped',
    ).length;
    const total = occurrences.length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const resolvedReports = reports.filter(
      (report) => String(report.status ?? '').toUpperCase() === 'RESOLVED',
    ).length;

    return {
      period,
      range: { startDate, endDate },
      totalTasks: (absoluteTasksResp as any).total || 0,
      taskSummary: {
        total,
        todo,
        pending,
        completed,
        skipped,
        completionRate,
      },
      recentTasks: occurrences.slice(0, 8),
      reportsSummary: {
        total: reports.length,
        resolved: resolvedReports,
        open: Math.max(0, reports.length - resolvedReports),
      },
      lowStockAlertsCount: Array.isArray(alertsResponse.alerts)
        ? alertsResponse.alerts.length
        : 0,
      totalWorkers: (membersRaw as any).total || 0,
      totalActiveTemplates: (templatesRaw as any).templates?.length || 0,
    };
  }
}
