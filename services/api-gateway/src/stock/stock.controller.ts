import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Inject,
  OnModuleInit,
  UseGuards,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard, AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ListMaterialsQueryDto } from './dto/list-materials-query.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { StockServiceClient } from './stock.interface';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FarmAccessGuard)
@Controller('stock')
export class StockController implements OnModuleInit {
  private stockService: StockServiceClient;

  constructor(@Inject('STOCK_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.stockService =
      this.client.getService<StockServiceClient>('StockService');
  }

  private getFarmId(req: any): string {
    return (
      req.farmMembership?.farm?.id ||
      req.farmMembership?.farmId ||
      req.farmMembership?.farm_id
    );
  }

  /**
   * Proto3 silently drops fields with default values (0, false, "").
   * This ensures every material has all fields so the frontend can render reliably.
   */
  private normalizeMaterial(
    raw: any,
    farmId?: string,
  ): Record<string, unknown> {
    return {
      id: raw.id ?? '',
      name: raw.name ?? '',
      category: raw.category ?? 'other',
      unit: raw.unit ?? '',
      quantity: raw.quantity ?? 0,
      min_threshold: raw.min_threshold ?? 0,
      farm_id: raw.farm_id || farmId || '',
      is_low_stock: raw.is_low_stock ?? false,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    };
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create a new stock material' })
  async createMaterial(
    @Body() dto: CreateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('min-threshold', String(dto.min_threshold ?? 0));
    const result = await firstValueFrom(
      this.stockService.createMaterial(
        {
          farm_id: farmId,
          name: dto.name,
          category: dto.category,
          unit: dto.unit,
          quantity: dto.quantity,
          min_threshold: dto.min_threshold ?? 0,
        },
        metadata,
      ),
    );
    return this.normalizeMaterial(result, farmId);
  }

  @Get('materials')
  @ApiOperation({ summary: 'List all stock materials for a farm' })
  async listMaterials(
    @Query() query: ListMaterialsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const response = await firstValueFrom(
      this.stockService.listMaterials(
        {
          ...query,
          farm_id: farmId,
          low_stock_only: query.low_stock_only || query.lowStockOnly,
        },
        metadata,
      ),
    );
    return {
      materials: Array.isArray(response.materials)
        ? response.materials.map((m) => this.normalizeMaterial(m, farmId))
        : [],
      total: response.total ?? 0,
    };
  }

  @Get('materials/:id')
  @ApiOperation({ summary: 'Get a single stock material' })
  async getMaterial(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('material-id', id);
    const result = await firstValueFrom(
      this.stockService.getMaterial(
        { material_id: id, farm_id: farmId },
        metadata,
      ),
    );
    return this.normalizeMaterial(result, farmId);
  }

  @Put('materials/:id')
  @ApiOperation({ summary: 'Update material' })
  async updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('material-id', id);

    // Pass min_threshold via metadata to bypass proto3 default-value dropping
    if (dto.min_threshold !== undefined) {
      metadata.add('min-threshold', String(dto.min_threshold));
    }

    const result = await firstValueFrom(
      this.stockService.updateMaterial(
        {
          material_id: id,
          farm_id: farmId,
          name: dto.name,
          category: dto.category,
          unit: dto.unit,
          quantity: dto.quantity,
          min_threshold: dto.min_threshold,
        },
        metadata,
      ),
    );
    return this.normalizeMaterial(result, farmId);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete a stock material' })
  async deleteMaterial(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('material-id', id);
    return firstValueFrom(
      this.stockService.deleteMaterial(
        { material_id: id, farm_id: farmId },
        metadata,
      ),
    );
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a stock transaction' })
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    metadata.add('material-id', dto.material_id);
    return firstValueFrom(
      this.stockService.createTransaction(
        {
          farm_id: farmId,
          material_id: dto.material_id,
          type: dto.type,
          quantity: dto.quantity,
          unit_cost: dto.unit_cost,
          notes: dto.notes,
        },
        metadata,
      ),
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions' })
  async listTransactions(
    @Query() query: ListTransactionsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    return firstValueFrom(
      this.stockService.listTransactions(
        {
          ...query,
          farm_id: farmId,
          material_id: query.materialId || query.material_id,
        },
        metadata,
      ),
    );
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  async getAlerts(@Req() req: AuthenticatedRequest) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    return firstValueFrom(
      this.stockService.getLowStockAlerts({ farm_id: farmId }, metadata),
    );
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get stock analytics' })
  async getAnalytics(@Query() query: any, @Req() req: AuthenticatedRequest) {
    const farmId = this.getFarmId(req);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    return firstValueFrom(
      this.stockService.getStockAnalytics(
        { ...query, farm_id: farmId },
        metadata,
      ),
    );
  }
}
