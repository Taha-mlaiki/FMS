import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FarmsService } from './farms.service';
import { status } from '@grpc/grpc-js';

@Controller()
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @GrpcMethod('FarmService', 'CreateFarm')
  async createFarm(data: { name: string; address?: string; type?: string }) {
    try {
      const farm = await this.farmsService.createFarm(data.name, {
        address: data.address,
        type: data.type,
      });
      return {
        id: farm.id,
        name: farm.name,
        address: farm.location,
        type: farm.type,
        schema_name: farm.schemaName,
        status: farm.status,
        created_at: farm.createdAt.toISOString(),
      };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('FarmService', 'GetFarm')
  async getFarm(data: { farmId: string }) {
    const farm = await this.farmsService.findById(data.farmId);
    if (!farm) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Farm not found',
      });
    }
    return {
      id: farm.id,
      name: farm.name,
      address: farm.location,
      type: farm.type,
      schema_name: farm.schemaName,
      status: farm.status,
      created_at: farm.createdAt.toISOString(),
    };
  }

  @GrpcMethod('FarmService', 'UpdateFarm')
  async updateFarm(data: {
    farmId: string;
    name?: string;
    address?: string;
    type?: string;
  }) {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.address) updateData.location = data.address;
      if (data.type) updateData.type = data.type;

      const farm = await this.farmsService.update(data.farmId, updateData);
      return {
        id: farm.id,
        name: farm.name,
        address: farm.location,
        type: farm.type,
        schema_name: farm.schemaName,
        status: farm.status,
        created_at: farm.createdAt.toISOString(),
      };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('FarmService', 'DeleteFarm')
  async deleteFarm(data: { farmId: string }) {
    await this.farmsService.delete(data.farmId);
    return { success: true, message: 'Farm deleted' };
  }

  @GrpcMethod('FarmService', 'ListFarms')
  async listFarms(data: { farmIds: string[] }) {
    const farms = await this.farmsService.getFarmsByIds(data.farmIds);
    return {
      farms: farms.map((farm) => ({
        id: farm.id,
        name: farm.name,
        address: farm.location,
        type: farm.type,
        schema_name: farm.schemaName,
        status: farm.status,
        created_at: farm.createdAt.toISOString(),
      })),
    };
  }
}
