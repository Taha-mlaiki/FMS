import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable, timeout } from 'rxjs';
import { CreateFarmDto } from './dto/create-farm.dto';

export interface FarmInfo {
  id: string;
  name: string;
  address?: string;
  type?: string;
  schemaName: string;
  status: string;
  createdAt: string;
}

interface FarmGrpcService {
  createFarm(data: CreateFarmDto, metadata?: any): Observable<FarmInfo>;
  getFarm(data: { farmId: string }, metadata?: any): Observable<FarmInfo>;
  updateFarm(
    data: {
      farmId: string;
      name?: string;
      address?: string;
      type?: string;
    },
    metadata?: any,
  ): Observable<FarmInfo>;
}

@Injectable()
export class FarmsService implements OnModuleInit {
  private farmGrpcService!: FarmGrpcService;

  constructor(@Inject('FARM_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.farmGrpcService =
      this.client.getService<FarmGrpcService>('FarmService');
  }

  async createFarm(data: CreateFarmDto, metadata?: any): Promise<FarmInfo> {
    return firstValueFrom(
      this.farmGrpcService.createFarm(data, metadata).pipe(timeout(15000)),
    );
  }

  async getFarm(farmId: string, metadata?: any): Promise<FarmInfo> {
    return firstValueFrom(
      this.farmGrpcService.getFarm({ farmId }, metadata).pipe(timeout(15000)),
    );
  }

  async updateFarm(
    farmId: string,
    data: { name?: string; address?: string; type?: string },
    metadata?: any,
  ): Promise<FarmInfo> {
    return firstValueFrom(
      this.farmGrpcService
        .updateFarm({ farmId, ...data }, metadata)
        .pipe(timeout(15000)),
    );
  }
}
