import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Farm, FarmStatus } from './entities/farm.entity';
import { SchemaService } from '@shared/database/schema.service';
import { TenantMigrationService } from '@shared/database/tenant-migration.service';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';

@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);

  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    private readonly schemaService: SchemaService,
    private readonly tenantMigrationService: TenantMigrationService,
    private readonly tenantConnectionManager: TenantConnectionManager,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new farm and provisions the physical PostgreSQL schema for the tenant.
   */
  async createFarm(
    farmName: string,
    args?: { address?: string; type?: string },
  ): Promise<Farm> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create the Farm record in the public schema
      const farm = new Farm();
      farm.id = randomUUID();
      farm.name = farmName;
      farm.status = FarmStatus.ACTIVE;
      farm.schemaName = this.schemaService.formatSchemaName(farm.id, farmName);
      if (args?.address) farm.location = args.address;
      if (args?.type) farm.type = args.type;

      const savedFarm = await queryRunner.manager.save(Farm, farm);

      // 2. Provision the physical database schema
      await this.schemaService.createSchema(savedFarm.schemaName);

      await queryRunner.commitTransaction();

      // 3. Run tenant migrations in background so register/login responses are not blocked.
      void this.runTenantMigrationsInBackground(
        savedFarm.id,
        savedFarm.schemaName,
      );

      this.logger.log(
        `Farm ${savedFarm.name} (${savedFarm.id}) created successfully with schema ${savedFarm.schemaName}`,
      );

      return savedFarm;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create farm: ${err.message}`, err.stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Farm | null> {
    return this.farmRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Farm>): Promise<Farm> {
    await this.farmRepository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('farm.not_found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const farm = await this.findById(id);
    if (!farm) throw new NotFoundException('farm.not_found');

    farm.status = FarmStatus.DELETED;
    await this.farmRepository.save(farm);
  }

  async getFarmsByIds(farmIds: string[]): Promise<Farm[]> {
    if (!farmIds || farmIds.length === 0) return [];

    return this.farmRepository
      .createQueryBuilder('farm')
      .where('farm.id IN (:...farmIds)', { farmIds })
      .getMany();
  }

  private async runTenantMigrationsInBackground(
    farmId: string,
    schemaName: string,
  ): Promise<void> {
    try {
      const tenantDataSource =
        await this.tenantConnectionManager.getTenantConnection(farmId);
      await this.tenantMigrationService.runMigrations(tenantDataSource);
      this.logger.log(`Tenant migrations completed for schema ${schemaName}`);
    } catch (error: any) {
      this.logger.error(
        `Tenant migrations failed for schema ${schemaName}: ${error.message}`,
        error.stack,
      );
    }
  }
}
