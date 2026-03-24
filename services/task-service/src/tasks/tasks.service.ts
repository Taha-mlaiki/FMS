import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { TaskCategory } from './entities/task-category.entity';
import { TenantConnectionManager } from '@shared/database/tenant-connection.manager';
import { TaskGeneratorService } from './task-generator.service';

export interface TaskListFilter {
  farmId: string;
  categoryId?: string;
  priority?: string;
  status?: string;
  workerId?: string;
  groupId?: string;
  templateId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TaskTemplateListFilter {
  farmId: string;
  categoryId?: string;
  priority?: string;
  isActive?: boolean | string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tenantManager: TenantConnectionManager,
    private readonly taskGenerator: TaskGeneratorService,
  ) {}

  private async getRepository<T extends ObjectLiteral>(
    farmId: string,
    entity: any,
  ): Promise<Repository<T>> {
    const connection = await this.tenantManager.getTenantConnection(farmId);
    return connection.getRepository(entity);
  }

  // ─── Categories ────────────────────────────────────────

  async createCategory(data: Partial<TaskCategory>): Promise<TaskCategory> {
    if (!data.farmId) throw new Error('farmId is required');
    const repo = await this.getRepository<TaskCategory>(
      data.farmId,
      TaskCategory,
    );
    const category = repo.create(data);
    return await repo.save(category);
  }

  async listCategories(farmId: string): Promise<TaskCategory[]> {
    const repo = await this.getRepository<TaskCategory>(farmId, TaskCategory);
    return await repo.find({
      order: { name: 'ASC' },
    });
  }

  async deleteCategory(id: string, farmId: string): Promise<void> {
    const repo = await this.getRepository<TaskCategory>(farmId, TaskCategory);
    await repo.delete({ id });
  }

  async findCategoryById(
    id: string,
    farmId: string,
  ): Promise<TaskCategory | null> {
    const repo = await this.getRepository<TaskCategory>(farmId, TaskCategory);
    return repo.findOneBy({ id });
  }

  // ─── Task Template CRUD ────────────────────────────────

  async createTaskTemplate(data: Partial<TaskTemplate>): Promise<TaskTemplate> {
    if (!data.farmId) throw new Error('farmId is required');
    const repo = await this.getRepository<TaskTemplate>(data.farmId, TaskTemplate);
    const template = repo.create(data);
    const saved = await repo.save(template);

    // Trigger async generation for the new template (today only)
    this.taskGenerator.generateTasksForFarm(data.farmId, 0).catch((e) => {
      this.logger.error('Failed to generate tasks securely from created template:', e);
    });

    return saved;
  }

  async findTemplateById(id: string, farmId: string): Promise<TaskTemplate | null> {
    const repo = await this.getRepository<TaskTemplate>(farmId, TaskTemplate);
    return repo.findOneBy({ id });
  }

  async updateTemplate(id: string, farmId: string, data: Partial<TaskTemplate>): Promise<TaskTemplate> {
    const repo = await this.getRepository<TaskTemplate>(farmId, TaskTemplate);
    await repo.update(id, data);
    const updated = await this.findTemplateById(id, farmId);
    if (!updated) throw new NotFoundException('task_template.not_found');

    // Trigger async generation against the patched template (today only)
    this.taskGenerator.generateTasksForFarm(farmId, 0).catch((e) => {
      this.logger.error('Failed to generate tasks securely from updated template:', e);
    });

    return updated;
  }

  async deleteTemplate(id: string, farmId: string): Promise<void> {
    const repo = await this.getRepository<TaskTemplate>(farmId, TaskTemplate);
    await repo.delete(id);
  }

  async listTemplates(filter: TaskTemplateListFilter): Promise<TaskTemplate[]> {
    const repo = await this.getRepository<TaskTemplate>(filter.farmId, TaskTemplate);
    const qb = repo.createQueryBuilder('template');

    if (filter.categoryId) {
      qb.andWhere('template.categoryId = :categoryId', { categoryId: filter.categoryId });
    }
    if (filter.priority) {
      qb.andWhere('template.priority = :priority', { priority: filter.priority });
    }
    if (filter.isActive !== undefined && filter.isActive !== '') {
      const active = filter.isActive === true || filter.isActive === 'true';
      qb.andWhere('template.isActive = :isActive', { isActive: active });
    }

    qb.orderBy('template.createdAt', 'DESC');
    return qb.getMany();
  }

  // ─── Task CRUD ─────────────────────────────────────────

  async createTask(data: Partial<Task>): Promise<Task> {
    if (!data.farmId) throw new Error('farmId is required');
    const repo = await this.getRepository<Task>(data.farmId, Task);
    const task = repo.create({
      ...data,
      status: TaskStatus.TODO,
    });
    return await repo.save(task);
  }

  async findTaskById(id: string, farmId: string): Promise<Task | null> {
    const repo = await this.getRepository<Task>(farmId, Task);
    return repo.findOneBy({ id });
  }

  async updateTask(
    id: string,
    farmId: string,
    data: Partial<Task>,
  ): Promise<Task> {
    const repo = await this.getRepository<Task>(farmId, Task);

    const updatePayload: Partial<Task> = { ...data };

    // If status is being updated to DONE or SKIPPED, set completion info
    if (data.status === TaskStatus.DONE || data.status === TaskStatus.SKIPPED) {
      updatePayload.completedAt = new Date();
    }

    await repo.update(id, updatePayload);
    const updated = await this.findTaskById(id, farmId);
    if (!updated) throw new NotFoundException('task.not_found');
    return updated;
  }

  async deleteTask(id: string, farmId: string): Promise<void> {
    const repo = await this.getRepository<Task>(farmId, Task);
    await repo.delete(id);
  }

  async listTasks(filter: TaskListFilter): Promise<[Task[], number]> {
    const repo = await this.getRepository<Task>(filter.farmId, Task);
    const qb = repo.createQueryBuilder('task');

    if (filter.categoryId) {
      qb.andWhere('task.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.priority) {
      qb.andWhere('task.priority = :priority', { priority: filter.priority });
    }

    if (filter.status) {
      qb.andWhere('task.status = :status', { status: filter.status });
    }

    if (filter.workerId) {
      qb.andWhere(':workerId = ANY(task.workerIds)', {
        workerId: filter.workerId,
      });
    }

    if (filter.groupId) {
      qb.andWhere(':groupId = ANY(task.groupIds)', {
        groupId: filter.groupId,
      });
    }

    if (filter.templateId) {
      qb.andWhere('task.templateId = :templateId', { templateId: filter.templateId });
    }

    // Date range filter
    if (filter.startDate) {
      qb.andWhere('task.scheduledDate >= :startDate', {
        startDate: filter.startDate,
      });
    }
    if (filter.endDate) {
      qb.andWhere('task.scheduledDate <= :endDate', {
        endDate: filter.endDate,
      });
    }

    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    qb.orderBy('task.scheduledDate', 'ASC')
      .addOrderBy('task.timeOfDay', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    return qb.getManyAndCount();
  }

  async countTasks(filter: {
    farmId: string;
    statuses?: string[];
    userId?: string;
  }): Promise<number> {
    const repo = await this.getRepository<Task>(filter.farmId, Task);
    const qb = repo.createQueryBuilder('task');

    if (filter.statuses?.length) {
      qb.andWhere('task.status IN (:...statuses)', {
        statuses: filter.statuses,
      });
    }

    if (filter.userId) {
      qb.andWhere(':userId = ANY(task.workerIds)', {
        userId: filter.userId,
      });
    }

    return await qb.getCount();
  }
}
