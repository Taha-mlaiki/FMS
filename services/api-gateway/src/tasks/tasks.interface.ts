import { Observable } from 'rxjs';

// Response types use camelCase (proto-loader default keepCase=false)
export interface TaskCategory {
  id: string;
  farmId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  farmId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  priority: string;
  templateId: string;
  status: string; // TODO, DOING, DONE, SKIPPED
  scheduledDate: string;
  timeOfDay: string;
  workerIds: string[];
  groupIds: string[];
  materials: any[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  completedBy: string;
  notes: string;
}

export interface TaskTemplate {
  id: string;
  farmId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  priority: string;
  recurrence: string;
  recurrenceConfig: any;
  timeOfDay: string;
  workerIds: string[];
  groupIds: string[];
  materials: any[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskServiceClient {
  // Categories
  createCategory(data: any, metadata?: any): Observable<TaskCategory>;
  listCategories(data: { farmId: string }, metadata?: any): Observable<{ categories: TaskCategory[] }>;
  deleteCategory(data: { categoryId: string; farmId: string }, metadata?: any): Observable<{ success: boolean }>;

  // Task CRUD
  createTask(data: any, metadata?: any): Observable<Task>;
  getTask(data: { taskId: string; farmId: string }, metadata?: any): Observable<Task>;
  updateTask(data: any, metadata?: any): Observable<Task>;
  deleteTask(data: { taskId: string; farmId: string }, metadata?: any): Observable<{ success: boolean }>;
  listTasks(query: any, metadata?: any): Observable<{ tasks: Task[]; total: number; page: number; limit: number }>;

  // Task Template CRUD
  createTaskTemplate(data: any, metadata?: any): Observable<TaskTemplate>;
  getTaskTemplate(data: { templateId: string; farmId: string }, metadata?: any): Observable<TaskTemplate>;
  updateTaskTemplate(data: any, metadata?: any): Observable<TaskTemplate>;
  deleteTaskTemplate(data: { templateId: string; farmId: string }, metadata?: any): Observable<{ success: boolean }>;
  listTaskTemplates(query: any, metadata?: any): Observable<{ templates: TaskTemplate[] }>;
}
