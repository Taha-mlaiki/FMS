import {
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
import { ProductionServiceClient } from '../production/production.interface';
import { AuthService } from '../auth/auth.service';

@Controller('farms/:farmId/task-templates')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class FarmTaskTemplatesController implements OnModuleInit {
  private readonly logger = new Logger(FarmTaskTemplatesController.name);
  private tasksService!: TaskServiceClient;
  private productionService!: ProductionServiceClient;

  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientGrpc,
    @Inject('PRODUCTION_SERVICE') private readonly productionClient: ClientGrpc,
    private readonly authService: AuthService,
  ) {}

  onModuleInit() {
    this.tasksService = this.tasksClient.getService<TaskServiceClient>('TaskService');
    this.productionService = this.productionClient.getService<ProductionServiceClient>('ProductionService');
  }

  @Post()
  async createTemplate(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    console.log('[DEBUG_API_GATEWAY_TEMPLATE_BODY]:', body);
    const metadata = createGrpcMetadata(req.user, farmId, req.farmMembership?.role);
    const template = await firstValueFrom(
      this.tasksService.createTaskTemplate(
        {
          ...body,
          farmId,
          start_date: body.startDate || body.start_date || null,
          end_date: body.endDate || body.end_date || null,
          time_of_day: body.timeOfDay || body.time_of_day || null,
          worker_ids: body.workerIds || body.worker_ids || [],
          group_ids: body.groupIds || body.group_ids || [],
        },
        metadata,
      ),
    );

    const enriched = await this.enrichTemplates(farmId, req.user.sub, [template], metadata);
    return enriched[0];
  }

  @Get()
  async listTemplates(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    const metadata = createGrpcMetadata(req.user, farmId, req.farmMembership?.role);
    const response = await firstValueFrom(
      this.tasksService.listTaskTemplates(
        {
          farmId,
          ...query,
        },
        metadata,
      ),
    );

    const enriched = await this.enrichTemplates(
      farmId,
      req.user.sub,
      response.templates || [],
      metadata,
    );

    return {
      ...response,
      templates: enriched,
    };
  }

  @Get(':id')
  async getTemplate(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const metadata = createGrpcMetadata(req.user, farmId, req.farmMembership?.role);
    const template = await firstValueFrom(
      this.tasksService.getTaskTemplate(
        {
          templateId: id,
          farmId,
        },
        metadata,
      ),
    );

    const enriched = await this.enrichTemplates(farmId, req.user.sub, [template], metadata);
    return enriched[0];
  }

  @Patch(':id')
  async updateTemplate(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const metadata = createGrpcMetadata(req.user, farmId, req.farmMembership?.role);
    const template = await firstValueFrom(
      this.tasksService.updateTaskTemplate(
        {
          ...body,
          template_id: id,
          templateId: id,
          farm_id: farmId,
          farmId,
          start_date: body.startDate || body.start_date || null,
          end_date: body.endDate || body.end_date || null,
          time_of_day: body.timeOfDay || body.time_of_day || null,
          worker_ids: body.workerIds || body.worker_ids,
          group_ids: body.groupIds || body.group_ids,
        } as any,
        metadata,
      ),
    );

    const enriched = await this.enrichTemplates(farmId, req.user.sub, [template], metadata);
    return enriched[0];
  }

  @Delete(':id')
  async deleteTemplate(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.tasksService.deleteTaskTemplate(
        {
          template_id: id,
          templateId: id,
          farm_id: farmId,
          farmId,
        } as any,
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
  }

  private async enrichTemplates(farmId: string, userId: string, templates: any[], metadata: any) {
    if (!templates || templates.length === 0) return templates;

    try {
      const [membersResp, groupsResp] = await Promise.all([
        this.authService.listFarmMembers(farmId, userId, { limit: 1000 }),
        firstValueFrom(this.productionService.listGroups({ farmId }, metadata)),
      ]);

      const memberMap = new Map();
      (membersResp.members || []).forEach(m => {
        const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || m.userId;
        memberMap.set(m.userId, { id: m.userId, name });
      });

      const groupMap = new Map();
      (groupsResp.groups || []).forEach(g => {
        groupMap.set(g.id, { id: g.id, name: g.name });
      });

      return templates.map(tmpl => ({
        ...tmpl,
        workers: (tmpl.worker_ids || tmpl.workerIds || []).map(id => memberMap.get(id) || { id, name: 'Unknown Worker' }),
        groups: (tmpl.group_ids || tmpl.groupIds || []).map(id => groupMap.get(id) || { id, name: 'Unknown Group' }),
      }));
    } catch (error) {
      this.logger.error(`Failed to enrich templates: ${error.message}`);
      return templates;
    }
  }
}
