import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status as GrpcStatus, Metadata } from '@grpc/grpc-js';
import * as fs from 'fs';
import {
  TasksService,
  TaskListFilter,
  TaskTemplateListFilter,
} from './tasks.service';

@Controller()
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  // In-memory category cache to avoid extra DB queries per mapping
  private categoryCache = new Map<string, { name: string; color: string }>();

  constructor(private readonly tasksService: TasksService) {}

  private extractMetadata(metadata: Metadata) {
    const farmId = metadata.get('farm-id')[0] as string;
    const userId = metadata.get('user-id')[0] as string;
    const userRole = metadata.get('user-role')[0] as string;

    if (!farmId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'farm-id is required in metadata',
      });
    }

    return { farmId, userId, userRole };
  }

  // ─── Categories ────────────────────────────────────────

  @GrpcMethod('TaskService', 'CreateCategory')
  async createCategory(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);
    const category = await this.tasksService.createCategory({
      farmId,
      name: data.name,
      color: data.color || null,
    });
    this.categoryCache.set(`${farmId}:${category.id}`, {
      name: category.name,
      color: category.color || '',
    });
    return this.mapCategory(category);
  }

  @GrpcMethod('TaskService', 'ListCategories')
  async listCategories(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);
    const categories = await this.tasksService.listCategories(farmId);
    return { categories: categories.map((c) => this.mapCategory(c)) };
  }

  @GrpcMethod('TaskService', 'DeleteCategory')
  async deleteCategory(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);
    const categoryId = data.categoryId ?? data.category_id;
    await this.tasksService.deleteCategory(categoryId, farmId);
    this.categoryCache.delete(`${farmId}:${categoryId}`);
    return { success: true, message: 'Category deleted' };
  }

  // ─── Task Template CRUD ────────────────────────────────

  @GrpcMethod('TaskService', 'CreateTaskTemplate')
  async createTaskTemplate(data: any, metadata: Metadata) {
    console.log('[DEBUG_GRPC_TASK_SERVICE_DATA]:', data);
    fs.writeFileSync('payload.log', JSON.stringify(data, null, 2));

    const { farmId, userId, userRole } = this.extractMetadata(metadata);

    if (userRole !== 'OWNER') {
      throw new RpcException({
        code: GrpcStatus.PERMISSION_DENIED,
        message: 'Only owners can create task templates',
      });
    }

    const template = await this.tasksService.createTaskTemplate({
      farmId,
      createdBy: userId,
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || data.category_id || null,
      priority: data.priority || 'medium',
      recurrence: data.recurrence,
      recurrenceConfig: data.recurrenceConfig || data.recurrence_config || null,
      startDate: data.startDate || data.start_date || null,
      endDate: data.endDate || data.end_date || null,
      timeOfDay: data.timeOfDay || data.time_of_day || null,
      workerIds: data.workerIds || data.worker_ids || [],
      groupIds: data.groupIds || data.group_ids || [],
      materials: this.normalizeMaterials(data.materials),
      isActive: data.isActive ?? data.is_active ?? true,
    });

    return await this.mapTaskTemplate(template, farmId);
  }

  @GrpcMethod('TaskService', 'GetTaskTemplate')
  async getTaskTemplate(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);
    const templateId = data.templateId ?? data.template_id;

    if (!this.isValidUuid(templateId)) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'Invalid template ID format',
      });
    }

    const template = await this.tasksService.findTemplateById(
      templateId,
      farmId,
    );
    if (!template) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Task template not found',
      });
    }
    return await this.mapTaskTemplate(template, farmId);
  }

  @GrpcMethod('TaskService', 'UpdateTaskTemplate')
  async updateTaskTemplate(data: any, metadata: Metadata) {
    const { farmId, userRole } = this.extractMetadata(metadata);
    const templateId = data.templateId ?? data.template_id;

    if (userRole !== 'OWNER') {
      throw new RpcException({
        code: GrpcStatus.PERMISSION_DENIED,
        message: 'Only owners can update task templates',
      });
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId || data.category_id,
      priority: data.priority,
      recurrence: data.recurrence,
      recurrenceConfig: data.recurrenceConfig || data.recurrence_config,
      startDate: data.startDate || data.start_date,
      endDate: data.endDate || data.end_date,
      timeOfDay: data.timeOfDay || data.time_of_day,
      workerIds: data.workerIds || data.worker_ids,
      groupIds: data.groupIds || data.group_ids,
      materials: data.materials
        ? this.normalizeMaterials(data.materials)
        : undefined,
      isActive: data.isActive ?? data.is_active,
    };

    // Filter out undefined keys
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updated = await this.tasksService.updateTemplate(
      templateId,
      farmId,
      updateData,
    );
    return await this.mapTaskTemplate(updated, farmId);
  }

  @GrpcMethod('TaskService', 'DeleteTaskTemplate')
  async deleteTaskTemplate(data: any, metadata: Metadata) {
    const { farmId, userRole } = this.extractMetadata(metadata);
    const templateId = data.templateId ?? data.template_id;

    if (!templateId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'Missing template ID',
      });
    }

    if (userRole !== 'OWNER') {
      throw new RpcException({
        code: GrpcStatus.PERMISSION_DENIED,
        message: 'Only owners can delete task templates',
      });
    }

    await this.tasksService.deleteTemplate(templateId, farmId);
    return { success: true, message: 'Task template deleted' };
  }

  @GrpcMethod('TaskService', 'ListTaskTemplates')
  async listTaskTemplates(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);
    const filter: TaskTemplateListFilter = {
      farmId,
      categoryId: data.categoryId || data.category_id,
      priority: data.priority,
      isActive: data.isActive ?? data.is_active,
    };

    const templates = await this.tasksService.listTemplates(filter);
    return {
      templates: await Promise.all(
        templates.map((t) => this.mapTaskTemplate(t, farmId)),
      ),
    };
  }

  // ─── Task CRUD ─────────────────────────────────────────

  @GrpcMethod('TaskService', 'CreateTask')
  async createTask(data: any, metadata: Metadata) {
    const { farmId, userId, userRole } = this.extractMetadata(metadata);

    if (userRole !== 'OWNER') {
      throw new RpcException({
        code: GrpcStatus.PERMISSION_DENIED,
        message: 'Only owners can create tasks',
      });
    }

    const task = await this.tasksService.createTask({
      farmId,
      createdBy: userId,
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || data.category_id || null,
      priority: data.priority || 'medium',
      templateId: data.templateId || data.template_id || null, // Link to template if provided
      scheduledDate:
        data.scheduledDate ||
        data.scheduled_date ||
        data.startDate ||
        data.start_date,
      timeOfDay: data.timeOfDay || data.time_of_day || null,
      workerIds: data.workerIds || data.worker_ids || [],
      groupIds: data.groupIds || data.group_ids || [],
      materials: this.normalizeMaterials(data.materials),
    });

    return await this.mapTask(task, farmId);
  }

  @GrpcMethod('TaskService', 'GetTask')
  async getTask(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);
    const taskId = data.taskId ?? data.task_id;

    if (!this.isValidUuid(taskId)) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'Invalid task ID format (UUID expected)',
      });
    }

    const task = await this.tasksService.findTaskById(taskId, farmId);
    if (!task) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Task not found',
      });
    }
    return await this.mapTask(task, farmId);
  }

  @GrpcMethod('TaskService', 'UpdateTask')
  async updateTask(data: any, metadata: Metadata) {
    const { farmId, userRole } = this.extractMetadata(metadata);
    const taskId = data.taskId ?? data.task_id;

    if (!this.isValidUuid(taskId)) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'Invalid task ID format (UUID expected)',
      });
    }

    const existing = await this.tasksService.findTaskById(taskId, farmId);
    if (!existing) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Task not found',
      });
    }

    // Normalize status to lowercase to match DB values
    const normalizedStatus = data.status
      ? this.normalizeStatus(data.status)
      : undefined;

    let updateData: any = {};

    if (userRole === 'OWNER') {
      updateData = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId || data.category_id,
        priority: data.priority,
        scheduledDate: data.scheduledDate || data.scheduled_date,
        timeOfDay: data.timeOfDay || data.time_of_day,
        status: normalizedStatus,
        workerIds: data.workerIds || data.worker_ids,
        groupIds: data.groupIds || data.group_ids,
        materials: data.materials
          ? this.normalizeMaterials(data.materials)
          : undefined,
        isActive: data.isActive ?? data.is_active,
        notes: data.notes,
      };
    } else {
      updateData = {
        status: normalizedStatus,
        notes: data.notes,
      };
    }

    // Filter out undefined keys
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updated = await this.tasksService.updateTask(
      taskId,
      farmId,
      updateData,
    );
    return await this.mapTask(updated, farmId);
  }

  @GrpcMethod('TaskService', 'DeleteTask')
  async deleteTask(data: any, metadata: Metadata) {
    const { farmId, userRole } = this.extractMetadata(metadata);
    const taskId = data.taskId ?? data.task_id;
    this.logger.log(`Deleting task: ${taskId} for farm: ${farmId}`);

    if (!this.isValidUuid(taskId)) {
      this.logger.error(`Invalid task ID format received: "${taskId}"`);
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'Invalid task ID format (UUID expected)',
      });
    }

    if (userRole !== 'OWNER') {
      throw new RpcException({
        code: GrpcStatus.PERMISSION_DENIED,
        message: 'Only owners can delete tasks',
      });
    }

    await this.tasksService.deleteTask(taskId, farmId);
    return { success: true, message: 'Task deleted' };
  }

  @GrpcMethod('TaskService', 'ListTasks')
  async listTasks(data: any, metadata: Metadata) {
    const { farmId } = this.extractMetadata(metadata);

    // Normalize frontend status names to DB values
    let status = data.status;
    if (status === 'completed') status = 'done';
    if (status) status = status.toLowerCase();

    const filter: TaskListFilter = {
      farmId,
      categoryId: data.categoryId || data.category_id,
      priority: data.priority,
      status,
      workerId: data.workerId || data.worker_id,
      groupId: data.groupId || data.group_id,
      templateId: data.templateId || data.template_id,
      startDate: data.startDate || data.start_date,
      endDate: data.endDate || data.end_date,
      page: this.parsePositiveInt(data.page, 1),
      limit: this.parsePositiveInt(data.limit, 10),
    };

    const [tasks, total] = await this.tasksService.listTasks(filter);

    return {
      tasks: await Promise.all(tasks.map((t) => this.mapTask(t, farmId))),
      total,
      page: filter.page,
      limit: filter.limit,
    };
  }

  @GrpcMethod('TaskService', 'HealthCheck')
  async healthCheck() {
    return { status: 'OK', service: 'task-service' };
  }

  // ─── Mappers ───────────────────────────────────────────

  private mapCategory(c: any) {
    return {
      id: c.id,
      farm_id: c.farmId,
      name: c.name,
      color: c.color || '',
      created_at: c.createdAt?.toISOString() || '',
    };
  }

  private async resolveCategory(
    categoryId: string | null | undefined,
    farmId: string,
  ): Promise<{ name: string; color: string }> {
    if (!categoryId) return { name: '', color: '' };

    const cacheKey = `${farmId}:${categoryId}`;
    const cached = this.categoryCache.get(cacheKey);
    if (cached) return cached;

    try {
      const cat = await this.tasksService.findCategoryById(categoryId, farmId);
      const result = cat
        ? { name: cat.name, color: cat.color || '' }
        : { name: '', color: '' };
      this.categoryCache.set(cacheKey, result);
      return result;
    } catch {
      return { name: '', color: '' };
    }
  }

  private async mapTask(t: any, farmId: string) {
    const cat = await this.resolveCategory(t.categoryId, farmId);
    this.logger.log(
      `Mapping task ${t.id}: groupIds=${JSON.stringify(t.groupIds)}, workerIds=${JSON.stringify(t.workerIds)}`,
    );
    const mapped = {
      id: t.id,
      farmId: t.farmId,
      farm_id: t.farmId,
      title: t.title,
      description: t.description || '',
      categoryId: t.categoryId || '',
      category_id: t.categoryId || '',
      categoryName: cat.name,
      category_name: cat.name,
      categoryColor: cat.color,
      category_color: cat.color,
      priority: t.priority,
      templateId: t.templateId || '',
      template_id: t.templateId || '',
      scheduledDate:
        t.scheduledDate instanceof Date
          ? t.scheduledDate.toISOString().split('T')[0]
          : t.scheduledDate || '',
      scheduled_date:
        t.scheduledDate instanceof Date
          ? t.scheduledDate.toISOString().split('T')[0]
          : t.scheduledDate || '',
      timeOfDay: t.timeOfDay || '',
      time_of_day: t.timeOfDay || '',
      status: t.status,
      workerIds: this.ensureArray(t.workerIds),
      worker_ids: this.ensureArray(t.workerIds),
      groupIds: this.ensureArray(t.groupIds),
      group_ids: this.ensureArray(t.groupIds),
      materials: this.serializeMaterials(t.materials),
      isActive: t.isActive,
      is_active: t.isActive,
      createdBy: t.createdBy,
      created_by: t.createdBy,
      createdAt: t.createdAt?.toISOString() || '',
      created_at: t.createdAt?.toISOString() || '',
      updatedAt: t.updatedAt?.toISOString() || '',
      updated_at: t.updatedAt?.toISOString() || '',
      completedAt: t.completedAt?.toISOString() || '',
      completed_at: t.completedAt?.toISOString() || '',
      completedBy: t.completedBy || '',
      completed_by: t.completedBy || '',
      notes: t.notes || '',
    };
    this.logger.log(
      `Mapped task ${t.id} results: group_ids=${JSON.stringify(mapped.group_ids)}`,
    );
    return mapped;
  }

  private async mapTaskTemplate(t: any, farmId: string) {
    const cat = await this.resolveCategory(t.categoryId, farmId);
    this.logger.log(
      `Mapping template ${t.id}: groupIds=${JSON.stringify(t.groupIds)}, workerIds=${JSON.stringify(t.workerIds)}`,
    );
    const mapped = {
      id: t.id,
      farmId: t.farmId,
      farm_id: t.farmId,
      title: t.title,
      description: t.description || '',
      categoryId: t.categoryId || '',
      category_id: t.categoryId || '',
      categoryName: cat.name,
      category_name: cat.name,
      categoryColor: cat.color,
      category_color: cat.color,
      priority: t.priority,
      recurrence: t.recurrence,
      recurrenceConfig: t.recurrenceConfig || {},
      recurrence_config: t.recurrenceConfig || {},
      timeOfDay: t.timeOfDay || '',
      time_of_day: t.timeOfDay || '',
      workerIds: this.ensureArray(t.workerIds),
      worker_ids: this.ensureArray(t.workerIds),
      groupIds: this.ensureArray(t.groupIds),
      group_ids: this.ensureArray(t.groupIds),
      materials: this.serializeMaterials(t.materials),
      isActive: t.isActive,
      is_active: t.isActive,
      createdBy: t.createdBy,
      created_by: t.createdBy,
      createdAt: t.createdAt?.toISOString() || '',
      created_at: t.createdAt?.toISOString() || '',
      updatedAt: t.updatedAt?.toISOString() || '',
      updated_at: t.updatedAt?.toISOString() || '',
    };
    this.logger.log(
      `Mapped template ${t.id} results: group_ids=${JSON.stringify(mapped.group_ids)}`,
    );
    return mapped;
  }

  private ensureArray(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      // Handle Postgres array string format {id1,id2}
      if (val.startsWith('{') && val.endsWith('}')) {
        const content = val.slice(1, -1).trim();
        return content ? content.split(',').map((s) => s.trim()) : [];
      }
      return [val];
    }
    return [];
  }

  private serializeMaterials(raw: any[]) {
    if (!Array.isArray(raw)) return [];
    return raw.map((m) => ({
      materialId: m.materialId,
      material_id: m.materialId,
      materialName: m.materialName,
      material_name: m.materialName,
      quantity: m.quantity,
      unit: m.unit,
    }));
  }

  private normalizeMaterials(raw: any[]) {
    if (!Array.isArray(raw)) return [];
    return raw.map((m) => ({
      materialId: m.material_id || m.materialId,
      materialName: m.material_name || m.materialName,
      quantity: m.quantity,
      unit: m.unit,
    }));
  }

  private normalizeStatus(status: string): string {
    const lower = status.toLowerCase();
    const valid = ['todo', 'doing', 'done', 'skipped'];
    return valid.includes(lower) ? lower : status;
  }

  private parsePositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private isValidUuid(id: any): boolean {
    if (!id || typeof id !== 'string') return false;
    const trimmed = id.trim();
    // More permissive regex that doesn't strictly check version/variant
    const regex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(trimmed);
  }
}
