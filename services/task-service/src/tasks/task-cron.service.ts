import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';
import { TaskGeneratorService } from './task-generator.service';

@Injectable()
export class TaskCronService {
  private readonly logger = new Logger(TaskCronService.name);

  constructor(
    private readonly tenantManager: TenantConnectionManager,
    private readonly taskGenerator: TaskGeneratorService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTaskGeneration() {
    this.logger.log('Starting daily task generation from templates...');
    try {
      const farms = await this.tenantManager.getAllTenantSchemas();
      this.logger.log(`Found ${farms.length} active farm schemas to process.`);
      
      for (const farmId of farms) {
        await this.taskGenerator.generateTasksForFarm(farmId, 0);
      }
      this.logger.log('Finished daily task generation successfully.');
    } catch (error) {
      this.logger.error('Error in daily task generation:', error);
    }
  }
}
