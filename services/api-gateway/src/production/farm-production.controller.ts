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
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProductionServiceClient } from './production.interface';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';

type MetricRecord = {
  recorded_at?: string;
  value?: string | number;
  metric_name?: string;
};

type MetricsResponse = {
  records?: MetricRecord[];
};

@Controller('farms/:farmId')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class FarmProductionController implements OnModuleInit {
  private productionService!: ProductionServiceClient;

  constructor(
    @Inject('PRODUCTION_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productionService =
      this.client.getService<ProductionServiceClient>('ProductionService');
  }

  @Get('metrics')
  async getMetricsByFarm(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Query('groupId') groupId?: string,
    @Query('period') period?: string,
    @Query('metricName') metricName?: string,
  ) {
    const now = new Date();
    const start = new Date(now);

    if (period === 'day') {
      start.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(now.getFullYear() - 1);
    }

    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );

    const response = await firstValueFrom(
      this.productionService.getMetrics(
        {
          farm_id: farmId,
          group_id: groupId,
          metric_type_id: metricName,
          start_date: start.toISOString().slice(0, 10),
          end_date: now.toISOString().slice(0, 10),
        },
        metadata,
      ),
    );

    const records = (response as MetricsResponse).records ?? [];
    const data = records.map((record) => ({
      date: record.recorded_at,
      value: record.value,
      metricName: record.metric_name,
    }));

    return { data };
  }
}
