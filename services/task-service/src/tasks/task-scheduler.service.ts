import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { TasksService } from './tasks.service';
import { TaskTemplate } from './entities/task-template.entity';
import { TaskStatus } from './entities/task.entity';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly baseDataSource: DataSource,
    private readonly tasksService: TasksService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTaskGeneration() {
    this.logger.log('Starting daily task generation from templates...');
    
    try {
      // 1. Get all farm IDs from the public.farms table
      const farms = await this.baseDataSource.query('SELECT id FROM public.farms');
      this.logger.log(`Found ${farms.length} farms to process.`);

      for (const farm of farms) {
        await this.processFarmTasks(farm.id);
      }
    } catch (error) {
      this.logger.error('Failed to process daily tasks', error.stack);
    }
  }

  private async processFarmTasks(farmId: string) {
    this.logger.debug(`Processing tasks for farm: ${farmId}`);
    
    try {
      // 2. Get all active templates for this farm
      const templates = await this.tasksService.listTemplates({
        farmId,
        isActive: true,
      });

      const today = new Date();
      // Reset time to midnight for comparison
      today.setHours(0, 0, 0, 0);

      for (const template of templates) {
        if (this.shouldTemplateRunToday(template, today)) {
          await this.createOccurrenceIfMissing(template, today);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process farm ${farmId}`, error.stack);
    }
  }

  private shouldTemplateRunToday(template: TaskTemplate, date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
    const dayOfMonth = date.getDate(); // 1-31

    switch (template.recurrence) {
      case 'daily':
        return true;
      case 'weekly':
        const days = template.recurrenceConfig?.daysOfWeek || [];
        return days.includes(dayOfWeek);
      case 'monthly':
        return template.recurrenceConfig?.dayOfMonth === dayOfMonth;
      default:
        return false;
    }
  }

  private async createOccurrenceIfMissing(template: TaskTemplate, date: Date) {
    const scheduledDateStr = date.toISOString().split('T')[0];

    // Check if task already exists for this template and date
    const [existing] = await this.tasksService.listTasks({
      farmId: template.farmId,
      templateId: template.id,
      startDate: scheduledDateStr,
      endDate: scheduledDateStr,
    });

    if (existing.length > 0) {
      this.logger.debug(`Task already exists for template ${template.id} on ${scheduledDateStr}`);
      return;
    }

    // Create the task occurrence
    await this.tasksService.createTask({
      farmId: template.farmId,
      templateId: template.id,
      title: template.title,
      description: template.description,
      categoryId: template.categoryId,
      priority: template.priority,
      status: TaskStatus.TODO,
      scheduledDate: date,
      timeOfDay: template.timeOfDay,
      workerIds: template.workerIds,
      groupIds: template.groupIds,
      materials: template.materials as any,
      createdBy: 'system',
    });

    this.logger.log(`Created occurrence for template ${template.id} on ${scheduledDateStr}`);
  }
}
