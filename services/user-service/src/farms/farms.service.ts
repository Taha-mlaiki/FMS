import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable, timeout } from 'rxjs';
import { UserFarm, FarmRole } from './entities/user-farm.entity';
import { User } from '../users/entities/user.entity';

// Interfaces mirroring the farm.proto
export interface FarmInfo {
  id: string;
  name: string;
  address: string;
  type: string;
  schemaName: string;
  status: string;
  createdAt: string;
}

interface FarmGrpcService {
  createFarm(data: { name: string }): Observable<FarmInfo>;
  getFarm(data: { farmId: string }): Observable<FarmInfo>;
  listFarms(data: { farmIds: string[] }): Observable<{ farms: FarmInfo[] }>;
}

@Injectable()
export class FarmsService implements OnModuleInit {
  private readonly logger = new Logger(FarmsService.name);
  private farmGrpcService: FarmGrpcService;

  constructor(
    @InjectRepository(UserFarm)
    private readonly userFarmRepository: Repository<UserFarm>,
    @Inject('FARM_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.farmGrpcService =
      this.client.getService<FarmGrpcService>('FarmService');
  }

  /**
   * Orchestrates farm creation across both microservices.
   * Calls farm-service to provision the schema and record,
   * then saves the UserFarm relationship locally.
   */
  async createFarmForUser(user: User, farmName: string): Promise<FarmInfo> {
    try {
      // 1. Call farm-service to provision farm and schema
      const farm = await firstValueFrom(
        this.farmGrpcService
          .createFarm({ name: farmName })
          .pipe(timeout(15000)),
      );

      this.logger.log(`Created schema farm remotely: ${farm.id}`);

      // 2. Assign the creator as the OWNER in the local user-service schema
      const userFarm = new UserFarm();
      userFarm.userId = user.id;
      userFarm.farmId = farm.id;
      userFarm.role = FarmRole.OWNER;

      await this.userFarmRepository.save(userFarm);

      return farm;
    } catch (err) {
      this.logger.error(
        `Failed to orchestrate farm creation: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async findById(farmId: string): Promise<FarmInfo | null> {
    try {
      return await firstValueFrom(
        this.farmGrpcService.getFarm({ farmId }).pipe(timeout(10000)),
      );
    } catch {
      return null;
    }
  }

  /**
   * Finds all farms a user belongs to (as OWNER or WORKER)
   */
  async findByUserId(userId: string): Promise<any[]> {
    const memberships = await this.userFarmRepository.find({
      where: { userId },
    });

    if (!memberships.length) return [];

    const farmIds = memberships.map((m) => m.farmId);

    // Fetch the detailed Farm objects from farm-service
    const response = await firstValueFrom(
      this.farmGrpcService.listFarms({ farmIds }).pipe(timeout(10000)),
    );
    const remoteFarms = response.farms || [];

    return memberships.map((m) => {
      const farmDetails = remoteFarms.find((f) => f.id === m.farmId);
      return {
        farm: farmDetails,
        role: m.role,
      };
    });
  }

  async findOwnedByUserId(userId: string): Promise<any[]> {
    const memberships = await this.userFarmRepository.find({
      where: { userId, role: FarmRole.OWNER, isActive: true },
    });

    if (!memberships.length) return [];

    const farmIds = memberships.map((m) => m.farmId);
    const response = await firstValueFrom(
      this.farmGrpcService.listFarms({ farmIds }).pipe(timeout(10000)),
    );
    const remoteFarms = response.farms || [];

    return memberships.map((m) => {
      const farmDetails = remoteFarms.find((f) => f.id === m.farmId);
      return {
        farm: farmDetails,
        role: m.role,
      };
    });
  }

  async getUserFarms(userId: string): Promise<FarmInfo[]> {
    const memberships = await this.userFarmRepository.find({
      where: { userId, isActive: true },
    });

    if (!memberships.length) return [];

    const farmIds = memberships.map((m) => m.farmId);
    const response = await firstValueFrom(
      this.farmGrpcService.listFarms({ farmIds }).pipe(timeout(10000)),
    );

    return response.farms || [];
  }

  async linkUserToFarm(
    userId: string,
    farmId: string,
    role: FarmRole = FarmRole.OWNER,
  ): Promise<void> {
    const existing = await this.userFarmRepository.findOne({
      where: { userId, farmId },
    });

    if (existing) {
      if (!existing.isActive || existing.role !== role) {
        existing.isActive = true;
        existing.role = role;
        await this.userFarmRepository.save(existing);
      }
      return;
    }

    const membership = this.userFarmRepository.create({
      userId,
      farmId,
      role,
      isActive: true,
    });

    await this.userFarmRepository.save(membership);
  }
}
