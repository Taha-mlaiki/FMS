import { Observable } from 'rxjs';

export interface Material {
  id: string;
  farm_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockServiceClient {
  createMaterial(data: any, metadata?: any): Observable<Material>;
  getMaterial(data: {
    material_id: string;
    farm_id: string;
  }, metadata?: any): Observable<Material>;
  updateMaterial(data: any, metadata?: any): Observable<Material>;
  deleteMaterial(data: {
    material_id: string;
    farm_id?: string;
  }, metadata?: any): Observable<{ success: boolean }>;
  listMaterials(
    query: any,
    metadata?: any,
  ): Observable<{ materials: Material[]; total: number }>;
  createTransaction(data: any, metadata?: any): Observable<any>;
  updateTransaction(data: any, metadata?: any): Observable<any>;
  listTransactions(
    query: any,
    metadata?: any,
  ): Observable<{ transactions: any[]; total: number }>;
  getLowStockAlerts(data: { farm_id: string }, metadata?: any): Observable<{ alerts: any[] }>;
  getStockAnalytics(query: any, metadata?: any): Observable<any>;
  decrementStock(data: any, metadata?: any): Observable<any>;
}
