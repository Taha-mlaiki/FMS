import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FarmAccessService } from '../auth/farm-access.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { GetMetricsQueryDto } from './dto/get-metrics-query.dto';
import { ListGroupsQueryDto } from './dto/list-groups-query.dto';
import { RecordMetricsDto } from './dto/record-metrics.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ProductionServiceClient } from './production.interface';
import { ListWorkersQueryDto } from './dto/list-workers-query.dto';
import { AuthService } from '../auth/auth.service';

import { createGrpcMetadata } from '../common/utils/grpc-helpers';

@ApiTags('Production Tracking')
@ApiBearerAuth('bearer')
@Controller('production')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class ProductionController implements OnModuleInit {
  private productionService!: ProductionServiceClient;

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }

  constructor(
    @Inject('PRODUCTION_SERVICE') private readonly prodClient: ClientGrpc,
    private readonly authService: AuthService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  onModuleInit() {
    this.productionService =
      this.prodClient.getService<ProductionServiceClient>('ProductionService');
  }

  private mapGroupForHttp(group: any) {
    if (!group || typeof group !== 'object') {
      return group;
    }

    const source = group as Record<string, any>;

    return {
      id: source.id,
      farmId: source.farm_id ?? source.farmId,
      name: source.name,
      type: source.type ?? source.species,
      species: source.species ?? source.type,
      breed: source.breed,
      building: source.building,
      initialQuantity: source.initial_quantity ?? source.initialQuantity ?? 0,
      currentQuantity: source.current_quantity ?? source.currentQuantity ?? 0,
      arrivalDate: source.arrival_date ?? source.arrivalDate,
      status: source.status,
      ageDays: source.age_days ?? source.ageDays,
      mortalityRate: source.mortality_rate ?? source.mortalityRate,
      createdAt: source.created_at ?? source.createdAt,
    };
  }

  @Post('groups')
  @ApiOperation({
    summary: 'Create a new animal group',
    description:
      'Creates a new animal group in a farm and stores type, breed, arrival date, and quantity.',
  })
  @ApiResponse({
    status: 201,
    description: 'Animal group created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGroup(
    @Body() dto: CreateGroupDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = req.farmMembership!.farm!.id;
    const dtoRecord = dto as unknown as Record<string, unknown>;

    const arrivalDate =
      this.toOptionalString(dtoRecord.arrival_date) ??
      this.toOptionalString(dtoRecord.arrivalDate) ??
      this.toOptionalString(dtoRecord.entry_date);
    const initialQuantity = this.toOptionalNumber(dtoRecord.initial_quantity);
    const type =
      this.toOptionalString(dtoRecord.type) ??
      this.toOptionalString(dtoRecord.species);

    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    const group = await firstValueFrom(
      this.productionService.createGroup(
        {
          ...dto,
          type,
          arrival_date: arrivalDate,
          arrivalDate,
          initial_quantity: initialQuantity,
          initialQuantity,
          farm_id: farmId,
          farmId,
        },
        metadata,
      ),
    );

    return this.mapGroupForHttp(group);
  }

  @Get('groups/:id')
  @ApiOperation({
    summary: 'Get details of an animal group',
    description: 'Returns detailed information for one animal group.',
  })
  @ApiParam({ name: 'id', description: 'Group ID', example: 'group-123' })
  @ApiQuery({
    name: 'farm_id',
    description: 'Farm ID that owns this group',
    example: 'farm-123',
  })
  @ApiResponse({ status: 200, description: 'Animal group details returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Animal group not found' })
  async getGroup(
    @Param('id') id: string,
    @Query('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const finalFarmId = req.farmMembership!.farm!.id;
    const metadata = createGrpcMetadata(
      req.user,
      finalFarmId,
      req.farmMembership?.role,
    );

    const group = await firstValueFrom(
      this.productionService.getGroup(
        {
          group_id: id,
          groupId: id,
          farm_id: finalFarmId,
          farmId: finalFarmId,
        },
        metadata,
      ),
    );

    return this.mapGroupForHttp(group);
  }

  @Get('groups')
  @ApiOperation({
    summary: 'List animal groups for a farm',
    description: 'Returns paginated groups with optional status filtering.',
  })
  @ApiResponse({ status: 200, description: 'Animal groups returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listGroups(
    @Query() query: ListGroupsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = req.farmMembership!.farm!.id;
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    const queryRecord = query as unknown as Record<string, unknown>;
    const limit = this.toOptionalNumber(queryRecord.limit) ?? 10;
    const explicitPage = this.toOptionalNumber(queryRecord.page);
    const offset = this.toOptionalNumber(queryRecord.offset) ?? 0;
    const page = explicitPage ?? Math.floor(offset / limit) + 1;

    const result = (await firstValueFrom(
      this.productionService.listGroups(
        {
          ...query,
          farmId: farmId,
          page,
          limit,
          offset,
        },
        metadata,
      ),
    )) as { groups?: unknown[]; total?: number };

    const groups =
      Array.isArray(result.groups) && result.groups.length > 0
        ? result.groups.map((group) => this.mapGroupForHttp(group))
        : [];

    return {
      ...result,
      groups,
    };
  }

  @Put('groups/:id')
  @ApiOperation({
    summary: 'Update animal group information',
    description: 'Partially updates an animal group.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the animal group to update',
    example: 'group-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Animal group updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Animal group not found' })
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: AuthenticatedRequest,
    @Query('farmId') _farmId?: string,
  ) {
    const finalFarmId = req.farmMembership!.farm!.id;

    if (req.farmMembership?.role === 'WORKER') {
      throw new BadRequestException('Only farm owners can update this group');
    }

    const dtoRecord = dto as unknown as Record<string, unknown>;
    const arrivalDate =
      this.toOptionalString(dtoRecord.arrival_date) ??
      this.toOptionalString(dtoRecord.arrivalDate) ??
      this.toOptionalString(dtoRecord.entry_date);
    const currentQuantity = this.toOptionalNumber(dtoRecord.current_quantity);

    const metadata = createGrpcMetadata(
      req.user,
      finalFarmId,
      req.farmMembership?.role,
    );

    const group = await firstValueFrom(
      this.productionService.updateGroup(
        {
          group_id: id,
          groupId: id,
          farm_id: finalFarmId,
          farmId: finalFarmId,
          ...dto,
          arrival_date: arrivalDate,
          arrivalDate,
          currentQuantity,
        },
        metadata,
      ),
    );

    return this.mapGroupForHttp(group);
  }

  @Delete('groups/:id')
  @ApiOperation({
    summary: 'Delete an animal group',
    description: 'Permanently removes an animal group.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the animal group to delete',
    example: 'group-123',
  })
  @ApiQuery({
    name: 'farm_id',
    description: 'Farm ID that owns this group',
    example: 'farm-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Animal group deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Animal group not found' })
  async deleteGroup(
    @Param('id') id: string,
    @Query('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const finalFarmId = req.farmMembership!.farm!.id;
    const metadata = createGrpcMetadata(
      req.user,
      finalFarmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.deleteGroup(
        {
          group_id: id,
          farm_id: finalFarmId,
        },
        metadata,
      ),
    );
  }

  @Post('metrics')
  @ApiOperation({
    summary: 'Record group metrics',
    description: 'Records one production metric for an animal group.',
  })
  @ApiResponse({ status: 201, description: 'Metric recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recordMetrics(
    @Body() dto: RecordMetricsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = req.farmMembership!.farm!.id;
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.recordMetrics(
        {
          ...dto,
          farmId,
          farm_id: farmId,
        },
        metadata,
      ),
    );
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'List production metrics history',
    description: 'Returns production metrics with optional filters.',
  })
  @ApiResponse({ status: 200, description: 'Metric records returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMetrics(
    @Query() query: GetMetricsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = req.farmMembership!.farm!.id;
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.getMetrics(
        {
          ...query,
          farmId,
          farm_id: farmId,
        },
        metadata,
      ),
    );
  }

  @Get('workers')
  @ApiOperation({
    summary: 'List active workers for a farm',
    description:
      'Returns paginated workers/members with optional status filtering.',
  })
  @ApiResponse({ status: 200, description: 'Farm workers returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listWorkers(
    @Query() query: ListWorkersQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = req.farmMembership!.farm!.id;
    const userId = req.user.sub;
    const queryRecord = query as unknown as Record<string, unknown>;
    const limit = this.toOptionalNumber(queryRecord.limit) ?? 10;
    const explicitPage = this.toOptionalNumber(queryRecord.page);
    const offset = this.toOptionalNumber(queryRecord.offset) ?? 0;
    const page = explicitPage ?? Math.floor(offset / limit) + 1;

    const result = (await this.authService.listFarmMembers(farmId, userId, {
      page,
      limit,
      status: query.status,
    })) as { members?: unknown[]; total?: number };

    const memberRows =
      Array.isArray(result.members) && result.members.length > 0
        ? result.members.map((member) => this.mapWorkerForHttp(member))
        : [];

    return {
      ...result,
      members: memberRows,
      page,
      limit,
    };
  }

  private mapWorkerForHttp(worker: any) {
    if (!worker || typeof worker !== 'object') {
      return worker;
    }

    const source = worker as Record<string, any>;
    const resolvedUserId =
      source.user_id ??
      source.userId ??
      source.id ??
      source.member_id ??
      source.memberId ??
      '';
    const firstName =
      source.first_name ??
      source.firstName ??
      source.given_name ??
      source.givenName ??
      '';
    const lastName =
      source.last_name ??
      source.lastName ??
      source.family_name ??
      source.familyName ??
      '';
    const fullName =
      source.full_name ??
      source.fullName ??
      source.name ??
      [firstName, lastName].filter(Boolean).join(' ');

    return {
      id: resolvedUserId,
      userId: resolvedUserId,
      user_id: resolvedUserId,
      email: source.email,
      firstName,
      first_name: firstName,
      lastName,
      last_name: lastName,
      fullName,
      full_name: fullName,
      phone: source.phone ?? source.phoneNumber,
      role: source.role,
      status: source.status,
      joinedAt: source.joined_at ?? source.joinedAt,
      join_date: source.join_date ?? source.joinDate,
      isActive: source.is_active ?? source.isActive,
    };
  }
}
