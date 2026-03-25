import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FarmAccessService } from '../auth/farm-access.service';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { StockServiceClient } from './stock.interface';

@Controller('farms/:farmId/stock')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class FarmStockController implements OnModuleInit {
  private stockService!: StockServiceClient;

  constructor(
    @Inject('STOCK_SERVICE') private readonly client: ClientGrpc,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  onModuleInit() {
    this.stockService =
      this.client.getService<StockServiceClient>('StockService');
  }

  @Get('alerts')
  async getAlerts(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const response = await firstValueFrom(
      this.stockService.getLowStockAlerts({ farm_id: farmId }, metadata),
    );
    const items = (response as any).alerts ?? [];
    return { items, count: items.length };
  }

  @Get('alerts/count')
  async getAlertsCount(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const response = await firstValueFrom(
      this.stockService.getLowStockAlerts({ farm_id: farmId }, metadata),
    );
    const items = (response as any).alerts ?? [];
    return { count: items.length };
  }
}
