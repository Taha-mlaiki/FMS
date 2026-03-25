import { Observable } from 'rxjs';

export interface AnimalGroup {
  id: string;
  farm_id?: string;
  farmId?: string;
  name: string;
  type?: string;
  species?: string;
  breed?: string;
  arrival_date?: string;
  arrivalDate?: string;
  initial_quantity?: number;
  initialQuantity?: number;
  current_quantity?: number;
  currentQuantity?: number;
  status?: string;
  building?: string;
  created_at?: string;
  createdAt?: string;
}

export interface ProductionServiceClient {
  createGroup(data: any, metadata?: any): Observable<AnimalGroup>;
  getGroup(
    data: {
      group_id: string;
      farm_id: string;
      groupId?: string;
      farmId?: string;
    },
    metadata?: any,
  ): Observable<AnimalGroup>;
  listGroups(
    query: any,
    metadata?: any,
  ): Observable<{ groups: AnimalGroup[]; total: number }>;
  updateGroup(data: any, metadata?: any): Observable<AnimalGroup>;
  deleteGroup(
    data: {
      group_id: string;
      farm_id: string;
    },
    metadata?: any,
  ): Observable<{ success: boolean; message: string }>;
  recordMetrics(data: any, metadata?: any): Observable<{ success: boolean }>;
  getMetrics(query: any, metadata?: any): Observable<{ records: any[] }>;
  createMetricType(data: any, metadata?: any): Observable<any>;
  updateMetricType(data: any, metadata?: any): Observable<any>;
  listMetricTypes(
    query: any,
    metadata?: any,
  ): Observable<{ metric_types: any[] }>;
  deleteMetricType(
    data: any,
    metadata?: any,
  ): Observable<{ success: boolean; message: string }>;
  recordMortality(data: any, metadata?: any): Observable<{ id: string }>;
  getProductionAnalytics(query: any, metadata?: any): Observable<any>;
}
