import { Observable } from 'rxjs';

export interface Report {
  id: string;
  farm_id: string;
  title: string;
  description?: string;
  type: string;
  severity: string;
  task_id?: string;
  group_ids?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportServiceClient {
  createReport(data: any, metadata?: any): Observable<Report>;
  getReport(
    data: { report_id: string; farm_id: string },
    metadata?: any,
  ): Observable<Report>;
  updateReport(data: any, metadata?: any): Observable<Report>;
  deleteReport(
    data: {
      report_id: string;
      farm_id?: string;
    },
    metadata?: any,
  ): Observable<{ success: boolean }>;
  listReports(
    query: any,
    metadata?: any,
  ): Observable<{ reports: Report[]; total: number }>;
  submitReport(data: any, metadata?: any): Observable<Report>;
  reviewReport(data: any, metadata?: any): Observable<Report>;
  resolveReport(data: any, metadata?: any): Observable<Report>;
  getReportAnalytics(query: any, metadata?: any): Observable<any>;
}
