import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { Repository, Between } from 'typeorm';
import {
  TransactionEntity,
  TransactionType,
} from './entities/transaction.entity';
import { MaterialsService } from '../materials/materials.service';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly tenantManager: TenantConnectionManager,
    private readonly materialsService: MaterialsService,
  ) {}

  private async getRepository(farmId: string): Promise<Repository<TransactionEntity>> {
    const connection = await this.tenantManager.getTenantConnection(farmId);
    return connection.getRepository(TransactionEntity);
  }

  async create(farmId: string, data: any): Promise<TransactionEntity> {
    const matId = data.materialId || data.material_id;
    const material = await this.materialsService.findById(farmId, matId);
    if (!material) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'stock.material_not_found',
      });
    }

    // Normalize type to lowercase to match entity enum values
    const normalizedType = (
      typeof data.type === 'string' ? data.type.toLowerCase() : data.type
    ) as TransactionType;

    const quantityBefore = material.quantity;
    let quantityAfter = quantityBefore;
    const delta = Number(data.quantity);

    switch (normalizedType) {
      case TransactionType.PURCHASE:
        quantityAfter += delta;
        break;
      case TransactionType.CONSUMPTION:
      case TransactionType.DAMAGE:
        quantityAfter -= delta;
        break;
      case TransactionType.ADJUSTMENT:
        quantityAfter = delta; // In adjustment, quantity is the NEW total
        break;
    }

    const unitCost = Number(data.unitCost || data.unit_cost || 0);
    const repo = await this.getRepository(farmId);
    const transaction = repo.create({
      materialId: matId,
      type: normalizedType,
      quantity: delta,
      unitCost,
      totalCost: delta * unitCost,
      quantityBefore,
      quantityAfter,
      notes: data.notes || null,
      createdBy: data.createdBy || data.created_by || 'unknown',
      referenceId: data.referenceId || data.reference_id || null,
    });

    const savedTransaction = await repo.save(transaction);

    // Update the material's current quantity
    await this.materialsService.update(farmId, matId, {
      quantity: quantityAfter,
    });

    return savedTransaction;
  }

  async update(farmId: string, id: string, data: any): Promise<TransactionEntity> {
    const repo = await this.getRepository(farmId);
    const transaction = await repo.findOne({ where: { id } });
    if (!transaction) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'stock.transaction_not_found',
      });
    }

    if (data.type !== undefined) {
      transaction.type = (
        typeof data.type === 'string' ? data.type.toLowerCase() : data.type
      ) as TransactionType;
    }
    if (data.quantity !== undefined)
      transaction.quantity = Number(data.quantity);
    if (data.unitCost !== undefined || data.unit_cost !== undefined) {
      transaction.unitCost = Number(data.unitCost ?? data.unit_cost);
      transaction.totalCost = transaction.quantity * transaction.unitCost;
    }
    if (data.notes !== undefined) transaction.notes = data.notes;

    return repo.save(transaction);
  }

  async list(farmId: string, filter: any): Promise<[TransactionEntity[], number]> {
    const repo = await this.getRepository(farmId);
    const where: any = {};
    const matId = filter.materialId || filter.material_id;
    if (matId) where.materialId = matId;
    if (filter.type) {
      where.type =
        typeof filter.type === 'string'
          ? filter.type.toLowerCase()
          : filter.type;
    }
    const startDate = filter.startDate || filter.start_date;
    const endDate = filter.endDate || filter.end_date;
    if (startDate && endDate) {
      where.createdAt = Between(
        new Date(startDate),
        new Date(endDate),
      );
    }

    const skip = ((filter.page || 1) - 1) * (filter.limit || 10);
    return repo.findAndCount({
      where,
      skip,
      take: filter.limit || 10,
      order: { createdAt: 'DESC' },
    });
  }

  async decrementStockBulk(
    farmId: string,
    taskId: string,
    decrements: any[],
  ): Promise<any[]> {
    const results = [];
    for (const dec of decrements) {
      const decMatId = dec.materialId || dec.material_id;
      const material = await this.materialsService.findById(farmId, decMatId);
      if (!material) continue;

      const transaction = await this.create(farmId, {
        materialId: decMatId,
        type: TransactionType.CONSUMPTION,
        quantity: dec.quantity,
        createdBy: 'system_task_service',
        referenceId: taskId,
        notes: `Auto-decrement from task ${taskId}`,
      });

      results.push({
        material_id: decMatId,
        quantity_before: transaction.quantityBefore,
        quantity_after: transaction.quantityAfter,
        is_low_stock: transaction.quantityAfter <= material.minThreshold,
      });
    }
    return results;
  }
}
