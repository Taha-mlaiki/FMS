import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { MaterialsService } from './materials/materials.service';
import { TransactionsService } from './transactions/transactions.service';
import { MaterialEntity } from './materials/entities/material.entity';

@Controller()
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(
    private readonly materialsService: MaterialsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  private extractMaterialId(data: any, metadata?: Metadata): string {
    const fromMeta = metadata?.get('material-id')?.[0] as string | undefined;
    const fromMetaLower = metadata?.get('material_id')?.[0] as
      | string
      | undefined;
    const id =
      fromMeta ||
      fromMetaLower ||
      data.materialId ||
      data.material_id ||
      data.id;

    if (!id) {
      this.logger.error(
        `[StockService] Failed to extract material_id. Data keys: ${Object.keys(
          data || {},
        ).join(', ')}`,
      );
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'material_id is required',
      });
    }
    return id;
  }

  private extractTransactionId(data: any, metadata?: Metadata): string {
    const fromMeta = metadata?.get('transaction-id')?.[0] as string | undefined;
    const fromMetaLower = metadata?.get('transaction_id')?.[0] as
      | string
      | undefined;
    const id =
      fromMeta ||
      fromMetaLower ||
      data.transactionId ||
      data.transaction_id ||
      data.id;

    if (!id) {
      this.logger.error(
        `[StockService] Failed to extract transaction_id. Data keys: ${Object.keys(
          data || {},
        ).join(', ')}`,
      );
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'transaction_id is required',
      });
    }
    return id;
  }

  /**
   * Proto3 drops double fields with value 0, so min_threshold sent from the
   * gateway may vanish from the data payload.  The gateway always mirrors the
   * value into gRPC metadata as a string, so we read it from there as fallback.
   */
  private extractMinThreshold(
    data: any,
    metadata?: Metadata,
  ): number | undefined {
    // 1. Try the data payload (works when value != 0)
    if (typeof data.min_threshold === 'number') return data.min_threshold;
    if (typeof data.minThreshold === 'number') return data.minThreshold;

    // 2. Fallback to metadata (always present when gateway sends it)
    const fromMeta = metadata?.get('min-threshold')?.[0] as string | undefined;
    if (fromMeta !== undefined) return Number(fromMeta);

    return undefined;
  }

  private extractFarmId(data: any, metadata?: Metadata): string {
    const fromMeta = metadata?.get('farm-id')?.[0] as string | undefined;
    const farmId = fromMeta || data.farmId || data.farm_id;
    if (!farmId) {
      this.logger.error(
        `[StockService] Failed to extract farm_id. Data keys: ${Object.keys(
          data || {},
        ).join(', ')}`,
      );
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }
    return farmId;
  }

  @GrpcMethod('StockService', 'CreateMaterial')
  async createMaterial(data: any, metadata?: Metadata) {
    try {
      const farmId = this.extractFarmId(data, metadata);
      const minThreshold = this.extractMinThreshold(data, metadata);
      const material = await this.materialsService.create(farmId, {
        farmId,
        name: data.name,
        category: data.category,
        unit: data.unit,
        quantity: data.quantity,
        minThreshold,
      });
      return this.mapMaterial(material);
    } catch (e) {
      if (e instanceof RpcException) throw e;
      throw new RpcException({ code: GrpcStatus.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('StockService', 'GetMaterial')
  async getMaterial(data: any, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractMaterialId(data, metadata);
    const material = await this.materialsService.findById(farmId, id);
    if (!material) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Material not found',
      });
    }
    return this.mapMaterial(material);
  }

  @GrpcMethod('StockService', 'UpdateMaterial')
  async updateMaterial(data: any, metadata?: Metadata) {
    const id = this.extractMaterialId(data, metadata);
    const farmId = this.extractFarmId(data, metadata);
    const minThreshold = this.extractMinThreshold(data, metadata);

    const updateData: Partial<MaterialEntity> = {};
    if (data.name) updateData.name = data.name;
    if (data.category) updateData.category = data.category;
    if (data.unit) updateData.unit = data.unit;
    if (typeof data.quantity === 'number') updateData.quantity = data.quantity;
    if (minThreshold !== undefined) updateData.minThreshold = minThreshold;

    const material = await this.materialsService.update(farmId, id, updateData);
    return this.mapMaterial(material);
  }

  @GrpcMethod('StockService', 'DeleteMaterial')
  async deleteMaterial(data: any, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const id = this.extractMaterialId(data, metadata);
    await this.materialsService.delete(farmId, id);
    return { success: true, message: 'Material deleted' };
  }

  @GrpcMethod('StockService', 'ListMaterials')
  async listMaterials(data: any, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const [materials, total] = await this.materialsService.list(farmId, data);
    return {
      materials: materials.map((m) => this.mapMaterial(m)),
      total,
      page: data.page || 1,
      limit: data.limit || 10,
    };
  }

  @GrpcMethod('StockService', 'CreateTransaction')
  async createTransaction(data: any, metadata?: Metadata) {
    try {
      const farmId = this.extractFarmId(data, metadata);
      const materialId = this.extractMaterialId(data, metadata);
      const transaction = await this.transactionsService.create(farmId, {
        ...data,
        materialId,
      });
      return this.mapTransaction(transaction);
    } catch (e) {
      if (e instanceof RpcException) throw e;
      this.logger.error(`CreateTransaction failed: ${e.message}`, e.stack);
      throw new RpcException({
        code: e.status === 404 ? GrpcStatus.NOT_FOUND : GrpcStatus.INTERNAL,
        message: e.message,
      });
    }
  }

  @GrpcMethod('StockService', 'UpdateTransaction')
  async updateTransaction(data: any, metadata?: Metadata) {
    try {
      const farmId = this.extractFarmId(data, metadata);
      const transactionId = this.extractTransactionId(data, metadata);
      const transaction = await this.transactionsService.update(
        farmId,
        transactionId,
        data,
      );
      return this.mapTransaction(transaction);
    } catch (e) {
      if (e instanceof RpcException) throw e;
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: e.message,
      });
    }
  }

  @GrpcMethod('StockService', 'ListTransactions')
  async listTransactions(data: any, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const [transactions, total] = await this.transactionsService.list(
      farmId,
      data,
    );
    return {
      transactions: transactions.map((t) => this.mapTransaction(t)),
      total,
      page: data.page || 1,
      limit: data.limit || 10,
    };
  }

  @GrpcMethod('StockService', 'DecrementStock')
  async decrementStock(data: any, metadata?: Metadata) {
    try {
      const farmId = this.extractFarmId(data, metadata);
      const results = await this.transactionsService.decrementStockBulk(
        farmId,
        data.taskOccurrenceId,
        data.decrements,
      );
      return { success: true, results };
    } catch (e) {
      if (e instanceof RpcException) throw e;
      throw new RpcException({ code: GrpcStatus.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('StockService', 'GetStockAnalytics')
  async getStockAnalytics(data: any, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const [materials] = await this.materialsService.list(farmId, {
      ...data,
      limit: 1000,
    });

    const lowStockCount = materials.filter(
      (m) => m.quantity <= m.minThreshold,
    ).length;

    const categories = [...new Set(materials.map((m) => m.category))];
    const byCategory = categories.map((cat) => ({
      category: cat,
      count: materials.filter((m) => m.category === cat).length,
    }));

    return {
      total_materials: materials.length,
      low_stock_count: lowStockCount,
      by_category: byCategory,
      consumption_trends: [],
    };
  }

  @GrpcMethod('StockService', 'GetLowStockAlerts')
  async getLowStockAlerts(data: any, metadata?: Metadata) {
    const farmId = this.extractFarmId(data, metadata);
    const [materials] = await this.materialsService.list(farmId, {
      low_stock_only: true,
    });
    return {
      alerts: materials.map((m) => this.mapAlert(m)),
    };
  }

  private mapAlert(m: any) {
    return {
      materialId: m.id,
      material_id: m.id,
      materialName: m.name,
      material_name: m.name,
      category: m.category,
      currentQuantity: m.quantity,
      current_quantity: m.quantity,
      threshold: m.minThreshold,
      unit: m.unit,
      severity: m.quantity <= 0 ? 'critical' : 'warning',
    };
  }

  @GrpcMethod('StockService', 'HealthCheck')
  async healthCheck() {
    return { status: 'OK', service: 'Stock Service' };
  }

  private mapMaterial(m: any) {
    const quantity = typeof m.quantity === 'number' ? m.quantity : 0;
    const minThreshold =
      typeof m.minThreshold === 'number' ? m.minThreshold : 0;

    return {
      id: m.id || '',
      farmId: m.farmId || m.farm_id || '',
      farm_id: m.farmId || m.farm_id || '',
      name: m.name || '',
      category: m.category || '',
      unit: m.unit || '',
      quantity,
      minThreshold,
      min_threshold: minThreshold,
      isLowStock: quantity <= minThreshold,
      is_low_stock: quantity <= minThreshold,
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : m.createdAt || new Date().toISOString(),
      created_at:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : m.createdAt || new Date().toISOString(),
      updatedAt:
        m.updatedAt instanceof Date
          ? m.updatedAt.toISOString()
          : m.updatedAt || new Date().toISOString(),
      updated_at:
        m.updatedAt instanceof Date
          ? m.updatedAt.toISOString()
          : m.updatedAt || new Date().toISOString(),
    };
  }

  private mapTransaction(t: any) {
    return {
      id: t.id,
      materialId: t.materialId,
      material_id: t.materialId,
      type: t.type,
      quantity: t.quantity,
      unitCost: t.unitCost || 0,
      unit_cost: t.unitCost || 0,
      totalCost: t.totalCost || 0,
      total_cost: t.totalCost || 0,
      quantityBefore: t.quantityBefore,
      quantity_before: t.quantityBefore,
      quantityAfter: t.quantityAfter,
      quantity_after: t.quantityAfter,
      notes: t.notes,
      createdBy: t.createdBy,
      created_by: t.createdBy,
      referenceId: t.referenceId,
      reference_id: t.referenceId,
      createdAt:
        t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      created_at:
        t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    };
  }
}
