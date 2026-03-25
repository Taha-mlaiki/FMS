import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status as GrpcStatus, Metadata } from '@grpc/grpc-js';
import { GroupsService } from './groups/groups.service';
import { TrackingService } from './tracking/tracking.service';

@Controller()
export class ProductionController {
  private readonly logger = new Logger(ProductionController.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly trackingService: TrackingService,
  ) {}

  @GrpcMethod('ProductionService', 'CreateGroup')
  async createGroup(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    try {
      const initialQuantity =
        data.initialQuantity ?? data.initial_quantity ?? 0;
      const type = data.type ?? data.species;
      const arrivalDate =
        data.arrivalDate ?? data.arrival_date ?? data.entry_date;

      if (!arrivalDate) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'arrival_date is required',
        });
      }

      const group = await this.groupsService.create(farmId, {
        ...data,
        type,
        initialQuantity,
        arrivalDate,
        currentQuantity: initialQuantity,
      });
      return this.mapGroup(group);
    } catch (e) {
      throw new RpcException({ code: GrpcStatus.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('ProductionService', 'GetGroup')
  async getGroup(
    data: {
      groupId?: string;
      group_id?: string;
      farmId?: string;
      farm_id?: string;
    },
    metadata: Metadata,
  ) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    const groupId = data.groupId ?? data.group_id;

    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }
    if (!groupId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'group_id is required',
      });
    }

    const group = await this.groupsService.findById(farmId, groupId);
    if (!group)
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Group not found',
      });
    return this.mapGroup(group);
  }

  @GrpcMethod('ProductionService', 'UpdateGroup')
  async updateGroup(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    const groupId = data.groupId ?? data.group_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }
    if (!groupId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'group_id is required',
      });
    }

    const updateData: Record<string, unknown> = {};
    const type = data.type ?? data.species;
    const currentQuantity = data.currentQuantity ?? data.current_quantity;
    const arrivalDate =
      data.arrivalDate ?? data.arrival_date ?? data.entry_date;

    if (typeof data.name === 'string') updateData.name = data.name;
    if (typeof type === 'string') updateData.type = type;
    if (typeof data.breed === 'string') updateData.breed = data.breed;
    if (typeof data.building === 'string') updateData.building = data.building;
    if (typeof data.status === 'string') updateData.status = data.status;
    if (currentQuantity !== undefined)
      updateData.currentQuantity = currentQuantity;
    if (arrivalDate !== undefined) updateData.arrivalDate = arrivalDate;

    const group = await this.groupsService.update(farmId, groupId, updateData);
    return this.mapGroup(group);
  }

  @GrpcMethod('ProductionService', 'DeleteGroup')
  async deleteGroup(
    data: { groupId: string; farmId?: string; farm_id?: string },
    metadata: Metadata,
  ) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    const groupId = data.groupId ?? (data as any).group_id;

    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    await this.groupsService.delete(farmId, groupId);
    return { success: true, message: 'Group deleted' };
  }

  @GrpcMethod('ProductionService', 'ListGroups')
  async listGroups(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const page = Math.max(Number(data.page ?? 1), 1);
    const limit = Math.max(Number(data.limit ?? 10), 1);

    const where: Record<string, unknown> = {};
    if (typeof data.status === 'string' && data.status.length > 0) {
      where.status = data.status;
    }

    const [groups, total] = await this.groupsService.list(farmId, {
      where,
      page,
      limit,
    });

    return {
      groups: groups.map((g) => this.mapGroup(g)),
      total,
      page,
      limit,
    };
  }

  @GrpcMethod('ProductionService', 'CreateMetricType')
  async createMetricType(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const type = await this.trackingService.createMetricType(farmId, {
      ...data,
      dataType: data.dataType,
    });
    return type;
  }

  @GrpcMethod('ProductionService', 'ListMetricTypes')
  async listMetricTypes(
    data: { farmId?: string; farm_id?: string; category?: string },
    metadata: Metadata,
  ) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const types = await this.trackingService.listMetricTypes(farmId, {
      category: data.category,
    });
    return { metric_types: types };
  }

  @GrpcMethod('ProductionService', 'RecordMetrics')
  async recordMetrics(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    const userId = metadata.get('user-id')[0] as string;

    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const count = await this.trackingService.recordMetrics(
      farmId,
      data.groupId,
      data.entries,
      userId || data.recordedBy,
      data.taskOccurrenceId,
    );
    return { success: true, recorded_count: count };
  }

  @GrpcMethod('ProductionService', 'GetMetrics')
  async getMetrics(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const records = await this.trackingService.getMetrics(
      farmId,
      data.groupId,
      data.metricTypeId,
      data.startDate,
      data.endDate,
    );
    return { records: records.map((r) => this.mapMetricRecord(r)) };
  }

  @GrpcMethod('ProductionService', 'RecordMortality')
  async recordMortality(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    const userId = metadata.get('user-id')[0] as string;

    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const record = await this.trackingService.recordMortality(farmId, {
      ...data,
      recordedBy: userId || data.recordedBy,
    });
    return this.mapMortalityRecord(record);
  }

  @GrpcMethod('ProductionService', 'GetMortalityHistory')
  async getMortalityHistory(data: any, metadata: Metadata) {
    const farmId =
      (metadata.get('farm-id')[0] as string) || data.farmId || data.farm_id;
    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm_id is required',
      });
    }

    const records = await this.trackingService.getMortalityHistory(
      farmId,
      data.groupId,
      data.startDate,
      data.endDate,
    );
    return { records: records.map((r) => this.mapMortalityRecord(r)) };
  }

  @GrpcMethod('ProductionService', 'HealthCheck')
  async healthCheck() {
    return { status: 'OK', service: 'Production Service' };
  }

  private mapGroup(g: any) {
    return {
      id: g.id,
      farmId: g.farmId,
      name: g.name,
      type: g.type,
      initialQuantity: g.initialQuantity,
      currentQuantity: g.currentQuantity,
      arrivalDate: g.arrivalDate,
      breed: g.breed,
      building: g.building,
      status: g.status,
      createdAt: g.createdAt?.toISOString?.() ?? '',
    };
  }

  private mapMetricRecord(r: any) {
    return {
      id: r.id,
      group_id: r.groupId,
      metric_type_id: r.metricTypeId,
      value: r.value,
      recorded_at: r.recordedAt.toISOString(),
      recorded_by: r.recordedBy,
    };
  }

  private mapMortalityRecord(m: any) {
    return {
      id: m.id,
      group_id: m.groupId,
      count: m.count,
      cause: m.cause,
      date: m.date,
      notes: m.notes,
    };
  }
}
