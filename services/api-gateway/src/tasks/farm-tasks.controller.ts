import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard, AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { TaskServiceClient } from './tasks.interface';
import { ReportServiceClient } from '../reports/reports.interface';
import { StockServiceClient } from '../stock/stock.interface';
import { AuthService } from '../auth/auth.service';
import { ProductionServiceClient } from '../production/production.interface';

@Controller('farms/:farmId/tasks')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class FarmTasksController implements OnModuleInit {
  private readonly logger = new Logger(FarmTasksController.name);
  private tasksService!: TaskServiceClient;
  private reportService!: ReportServiceClient;
  private stockService!: StockServiceClient;
  private productionService!: ProductionServiceClient;

  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientGrpc,
    @Inject('REPORTS_SERVICE') private readonly reportsClient: ClientGrpc,
    @Inject('STOCK_SERVICE') private readonly stockClient: ClientGrpc,
    @Inject('PRODUCTION_SERVICE') private readonly productionClient: ClientGrpc,
    private readonly authService: AuthService,
  ) {}

  onModuleInit() {
    this.tasksService =
      this.tasksClient.getService<TaskServiceClient>('TaskService');
    this.reportService =
      this.reportsClient.getService<ReportServiceClient>('ReportService');
    this.stockService =
      this.stockClient.getService<StockServiceClient>('StockService');
    this.productionService =
      this.productionClient.getService<ProductionServiceClient>(
        'ProductionService',
      );
  }

  @Get()
  async listTasks(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    const membershipRole = String(req.farmMembership?.role ?? '').toUpperCase();
    const effectiveQuery =
      membershipRole === 'WORKER'
        ? {
            ...query,
            workerId: req.user.sub,
            worker_id: req.user.sub,
          }
        : query;

    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const response = await firstValueFrom(
      this.tasksService.listTasks(
        {
          farmId,
          ...effectiveQuery,
        },
        metadata,
      ),
    );

    const enrichedTasks = await this.enrichTasks(
      farmId,
      req.user.sub,
      response.tasks || [],
      metadata,
    );

    return {
      ...response,
      tasks: enrichedTasks,
    };
  }

  @Post()
  async createTask(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    await this.validateAssignments(req, body.workerIds, body.groupIds);

    const task = await firstValueFrom(
      this.tasksService.createTask(
        {
          ...body,
          farmId,
          farm_id: farmId,
          templateId: body.templateId || body.template_id || null,
          template_id: body.template_id || body.templateId || null,
          categoryId: body.categoryId || body.category_id || null,
          category_id: body.category_id || body.categoryId || null,
          scheduledDate:
            body.scheduledDate ||
            body.startDate ||
            body.scheduled_date ||
            body.start_date,
          scheduled_date:
            body.scheduled_date ||
            body.start_date ||
            body.scheduledDate ||
            body.startDate ||
            null,
          timeOfDay: body.timeOfDay || body.time_of_day || null,
          time_of_day: body.time_of_day || body.timeOfDay || null,
          worker_ids: body.workerIds || body.worker_ids || [],
          workerIds: body.workerIds || body.worker_ids || [],
          group_ids: body.groupIds || body.group_ids || [],
          groupIds: body.groupIds || body.group_ids || [],
        },
        metadata,
      ),
    );

    const enriched = await this.enrichTasks(
      farmId,
      req.user.sub,
      [task],
      metadata,
    );
    return enriched[0];
  }

  @Get('count')
  async countTasks(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    const membershipRole = String(req.farmMembership?.role ?? '').toUpperCase();
    const effectiveQuery =
      membershipRole === 'WORKER'
        ? {
            ...query,
            workerId: req.user.sub,
            worker_id: req.user.sub,
          }
        : query;

    const response = await firstValueFrom(
      this.tasksService.listTasks(
        {
          farmId,
          ...effectiveQuery,
          limit: 1, // We only need the total count from the response
        },
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
    return { count: response.total };
  }

  @Get('/worker-tasks')
  async listWorkerTasks(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    // Always filter by current user and exclude templates
    const effectiveQuery = {
      ...query,
      workerId: req.user.sub,
      worker_id: req.user.sub,
      isTemplate: false,
      is_template: false,
    };

    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const response = await firstValueFrom(
      this.tasksService.listTasks(
        {
          farmId,
          ...effectiveQuery,
        },
        metadata,
      ),
    );

    // Optionally filter out templates if backend does not
    const onlyTasks = Array.isArray(response.tasks)
      ? response.tasks.filter((t: any) => !t.recurrence && !t.is_template)
      : [];

    const enrichedTasks = await this.enrichTasks(
      farmId,
      req.user.sub,
      onlyTasks,
      metadata,
    );

    return {
      ...response,
      tasks: enrichedTasks,
      total: enrichedTasks.length,
    };
  }

  @Get(':id')  async getTask(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const task = await firstValueFrom(
      this.tasksService.getTask(
        {
          taskId: id,
          task_id: id,
          farmId,
          farm_id: farmId,
        } as any,
        metadata,
      ),
    );

    const enriched = await this.enrichTasks(
      farmId,
      req.user.sub,
      [task],
      metadata,
    );
    return enriched[0];
  }

  @Patch(':id')
  async updateTask(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    if (body.workerIds || body.groupIds) {
      await this.validateAssignments(req, body.workerIds, body.groupIds);
    }

    const task = await firstValueFrom(
      this.tasksService.updateTask(
        {
          ...body,
          taskId: id,
          task_id: id,
          farmId,
          farm_id: farmId,
          worker_ids: body.workerIds || body.worker_ids,
          group_ids: body.groupIds || body.group_ids,
        } as any,
        metadata,
      ),
    );

    const enriched = await this.enrichTasks(
      farmId,
      req.user.sub,
      [task],
      metadata,
    );
    return enriched[0];
  }

  @Delete(':id')
  async deleteTask(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.tasksService.deleteTask(
        {
          taskId: id,
          task_id: id,
          farmId,
          farm_id: farmId,
        } as any,
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
  }

  private async enrichTasks(
    farmId: string,
    userId: string,
    tasks: any[],
    metadata: any,
  ) {
    if (!tasks || tasks.length === 0) return tasks;

    try {
      const [membersResp, groupsResp] = await Promise.all([
        this.authService.listFarmMembers(farmId, userId, { limit: 1000 }),
        firstValueFrom(this.productionService.listGroups({ farmId }, metadata)),
      ]);

      const memberMap = new Map();
      (membersResp.members || []).forEach((m) => {
        const name =
          `${m.firstName || ''} ${m.lastName || ''}`.trim() ||
          m.email ||
          m.userId;
        memberMap.set(m.userId, { id: m.userId, name });
      });

      const groupMap = new Map();
      (groupsResp.groups || []).forEach((g) => {
        groupMap.set(g.id, { id: g.id, name: g.name });
      });

      return tasks.map((task) => ({
        ...task,
        workers: (task.worker_ids || task.workerIds || []).map(
          (id) => memberMap.get(id) || { id, name: 'Unknown Worker' },
        ),
        groups: (task.group_ids || task.groupIds || []).map(
          (id) => groupMap.get(id) || { id, name: 'Unknown Group' },
        ),
      }));
    } catch (error) {
      this.logger.error(`Failed to enrich tasks: ${error.message}`);
      return tasks; // Return unenriched on error to avoid breaking the response
    }
  }

  /**
   * Complete a task.
   * Orchestrates: create report → auto-submit → decrement stock → mark status as done.
   */
  @Post(':id/complete')
  async completeTask(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    // Accept both camelCase and snake_case from frontend
    const report = body.report;
    const materialsUsed: Array<{
      material_id?: string;
      materialId?: string;
      quantity: number;
    }> = body.materials_used || body.materialsUsed || [];
    const notes = body.notes || '';

    // 1. Create and submit the report if provided
    if (report) {
      const normalizedType =
        typeof report.type === 'string' ? report.type.toUpperCase() : undefined;
      const normalizedSeverity =
        typeof report.severity === 'string'
          ? report.severity.toUpperCase()
          : undefined;

      const created = await firstValueFrom(
        this.reportService.createReport(
          {
            farm_id: farmId,
            created_by: req.user.sub,
            title: report.title,
            description: report.description,
            type: normalizedType,
            severity: normalizedSeverity,
            task_id: id,
            group_ids:
              report.group_ids ||
              report.groupIds ||
              (report.group_id ? [report.group_id] : []),
          },
          metadata,
        ),
      );

      try {
        await firstValueFrom(
          this.reportService.submitReport(
            {
              report_id: created.id,
              farm_id: farmId,
              submitted_by: req.user.sub,
            },
            metadata,
          ),
        );
      } catch (e) {
        this.logger.warn(
          `Failed to auto-submit report ${created.id}: ${e.message}`,
        );
      }
    }

    // 2. Decrement stock if materials were used
    if (materialsUsed.length > 0) {
      try {
        await firstValueFrom(
          this.stockService.decrementStock(
            {
              farmId,
              taskOccurrenceId: id,
              decrements: materialsUsed.map((m) => ({
                materialId: m.material_id || m.materialId,
                quantity: m.quantity,
              })),
            },
            metadata,
          ),
        );
      } catch (e) {
        this.logger.warn(
          `Failed to decrement stock for task ${id}: ${e.message}`,
        );
      }
    }

    // 3. Update task status to done with notes
    return firstValueFrom(
      this.tasksService.updateTask(
        {
          taskId: id,
          task_id: id,
          farmId,
          farm_id: farmId,
          status: 'done',
          notes,
        },
        metadata,
      ),
    );
  }

  @Post(':id/skip')
  async skipTask(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { notes?: string; reason?: string },
  ) {
    return firstValueFrom(
      this.tasksService.updateTask(
        {
          taskId: id,
          task_id: id,
          farmId,
          farm_id: farmId,
          status: 'skipped',
          notes: body.notes || body.reason || '',
        } as any,
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
  }

  private async validateAssignments(
    req: AuthenticatedRequest,
    workerIds?: string[],
    groupIds?: string[],
  ): Promise<void> {
    const farmId = (req.params as any).farmId;
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    // 1. Validate Workers
    if (workerIds && workerIds.length > 0) {
      const membersResponse = await this.authService.listFarmMembers(
        farmId,
        req.user.sub,
        { status: 'active' },
      );
      const acceptedWorkerIds = new Set(
        membersResponse.members.map((m) => m.userId),
      );

      const invalidWorkers = workerIds.filter(
        (id) => !acceptedWorkerIds.has(id),
      );
      if (invalidWorkers.length > 0) {
        throw new BadRequestException(
          `Invalid worker assignments. The following users have not accepted their invitation or are not members: ${invalidWorkers.join(', ')}`,
        );
      }
    }

    // 2. Validate Groups
    if (groupIds && groupIds.length > 0) {
      const groupsResponse = await firstValueFrom(
        this.productionService.listGroups({ farmId }, metadata),
      );
      const existingGroupIds = new Set(groupsResponse.groups.map((g) => g.id));

      const invalidGroups = groupIds.filter((id) => !existingGroupIds.has(id));
      if (invalidGroups.length > 0) {
        throw new BadRequestException(
          `Invalid group assignments. The following groups do not exist: ${invalidGroups.join(', ')}`,
        );
      }
    }
  }
}
