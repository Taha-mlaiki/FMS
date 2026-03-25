import { Injectable, Logger } from '@nestjs/common';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';
import { TaskTemplate } from './entities/task-template.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { In } from 'typeorm';

@Injectable()
export class TaskGeneratorService {
  private readonly logger = new Logger(TaskGeneratorService.name);

  constructor(private readonly tenantManager: TenantConnectionManager) {}

  async generateTasksForFarm(
    farmId: string,
    daysLookahead: number = 0,
  ): Promise<void> {
    try {
      const connection = await this.tenantManager.getTenantConnection(farmId);
      const templateRepo = connection.getRepository(TaskTemplate);
      const taskRepo = connection.getRepository(Task);

      // Fetch active templates that have recurrence
      const templates = await templateRepo.find({ where: { isActive: true } });
      const recurringTemplates = templates.filter(
        (t) => t.recurrence && t.recurrence !== 'once' && t.startDate,
      );

      if (!recurringTemplates.length) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create a list of dates to check
      const datesToCheck: { date: Date; dateStr: string }[] = [];
      for (let i = 0; i <= daysLookahead; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        datesToCheck.push({ date: d, dateStr: this.toIsoDate(d) });
      }

      // Fetch existing tasks for these templates in this date window to avoid duplicates
      const templateIds = recurringTemplates.map((t) => t.id);
      const dateStrs = datesToCheck.map((d) => d.dateStr);

      const existingTasks = await taskRepo.find({
        where: {
          templateId: In(templateIds),
          scheduledDate: In(dateStrs),
        },
      });

      // Create a set of "templateId_dateStr" for quick lookup
      const existingSet = new Set(
        existingTasks.map((t) => `${t.templateId}_${String(t.scheduledDate)}`),
      );

      const newTasks: Partial<Task>[] = [];

      for (const template of recurringTemplates) {
        const tStart = new Date(template.startDate);
        tStart.setHours(0, 0, 0, 0);

        const tEnd = template.endDate ? new Date(template.endDate) : null;
        if (tEnd) tEnd.setHours(23, 59, 59, 999);

        // Parse recurrence config
        let daysOfWeek: number[] = [];
        let dayOfMonth: number | null = null;
        let monthOfYear: number | null = null;

        if (template.recurrenceConfig) {
          if (Array.isArray(template.recurrenceConfig.daysOfWeek)) {
            daysOfWeek = template.recurrenceConfig.daysOfWeek;
          }
          if (template.recurrenceConfig.dayOfMonth) {
            dayOfMonth = Number(template.recurrenceConfig.dayOfMonth);
          }
          if (template.recurrenceConfig.monthOfYear) {
            monthOfYear = Number(template.recurrenceConfig.monthOfYear);
          }
        }

        for (const { date, dateStr } of datesToCheck) {
          // Check bounds
          if (date < tStart) continue;
          if (tEnd && date > tEnd) continue;

          // Check if already exists
          if (existingSet.has(`${template.id}_${dateStr}`)) continue;

          // Check recurrence match
          let shouldGenerate = false;

          switch (template.recurrence) {
            case 'daily':
              shouldGenerate = true;
              break;
            case 'weekly':
              if (daysOfWeek.includes(date.getDay())) {
                shouldGenerate = true;
              }
              break;
            case 'monthly':
              if (dayOfMonth && date.getDate() === dayOfMonth) {
                shouldGenerate = true;
              }
              break;
            case 'yearly':
              if (
                monthOfYear &&
                dayOfMonth &&
                date.getMonth() + 1 === monthOfYear &&
                date.getDate() === dayOfMonth
              ) {
                shouldGenerate = true;
              }
              break;
          }

          if (shouldGenerate) {
            newTasks.push({
              farmId: template.farmId,
              templateId: template.id,
              title: template.title,
              description: template.description || '',
              categoryId: template.categoryId,
              priority: template.priority,
              scheduledDate: dateStr as any,
              timeOfDay: template.timeOfDay,
              workerIds: template.workerIds,
              groupIds: template.groupIds,
              materials: template.materials,
              status: TaskStatus.TODO,
              createdBy: template.createdBy,
            });
          }
        }
      }

      if (newTasks.length > 0) {
        await taskRepo.save(newTasks);
        this.logger.log(
          `Generated ${newTasks.length} tasks for farm ${farmId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error generating tasks for farm ${farmId}:`, error);
    }
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
