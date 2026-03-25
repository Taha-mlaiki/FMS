import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { ProductionServiceClient } from './production.interface';

@Controller('farms/:farmId/metric-types')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class FarmMetricTypesController implements OnModuleInit {
  private productionService!: ProductionServiceClient;

  constructor(
    @Inject('PRODUCTION_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productionService =
      this.client.getService<ProductionServiceClient>('ProductionService');
  }

  @Get()
  async listMetricTypes(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.listMetricTypes(
        {
          farm_id: farmId,
          farmId,
          category,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        metadata,
      ),
    );
  }

  @Post()
  async createMetricType(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.createMetricType(
        {
          farm_id: farmId,
          farmId,
          ...body,
        },
        metadata,
      ),
    );
  }

  @Patch(':id')
  async updateMetricType(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.updateMetricType(
        {
          metric_type_id: id,
          metricTypeId: id,
          farm_id: farmId,
          farmId,
          ...body,
        },
        metadata,
      ),
    );
  }

  @Delete(':id')
  async deleteMetricType(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    return firstValueFrom(
      this.productionService.deleteMetricType(
        {
          metric_type_id: id,
          metricTypeId: id,
          farm_id: farmId,
          farmId,
        },
        metadata,
      ),
    );
  }
}
