import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application, ApplicationStatus } from '../models';

export interface BoardDecision {
  id: string;
  applicationId: string;
  decision: string;
  meetingDate?: Date;
  meetingNumber?: string;
  decisionNumber?: string;
  notes?: string;
  conditions?: string;
  decidedAt?: Date;
  isSentToOidb: boolean;
  sentToOidbAt?: Date;
}

export interface DepartmentStatistics {
  department: string;
  total: number;
  byStatus: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class FacultyService {
  private readonly API_URL = 'http://localhost:5001/api/faculty';

  constructor(private http: HttpClient) {}

  /**
   * Fakülteye yönlendirilmiş başvuruları getir
   */
  getApplications(faculty?: string, status?: ApplicationStatus): Observable<Application[]> {
    let params = new HttpParams();
    if (faculty) params = params.set('faculty', faculty);
    if (status) params = params.set('status', status);
    return this.http.get<Application[]>(`${this.API_URL}/applications`, { params });
  }

  /**
   * Bölüme yönlendirilmeyi bekleyen başvurular
   */
  getPendingRouting(faculty?: string): Observable<Application[]> {
    let params = new HttpParams();
    if (faculty) params = params.set('faculty', faculty);
    return this.http.get<Application[]>(`${this.API_URL}/pending-routing`, { params });
  }

  /**
   * Başvuruları bölüme toplu yönlendir
   */
  routeToDepartment(applicationIds: string[]): Observable<any> {
    return this.http.post(`${this.API_URL}/route-to-department`, { applicationIds });
  }

  /**
   * Fakülte ön incelemesinde başvuruyu reddet
   */
  rejectApplication(applicationId: string, reason: string, notes?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reject-application`, {
      applicationId,
      reason,
      notes,
    });
  }

  /**
   * Fakülte Kurulu kararı bekleyen başvurular
   */
  getPendingBoardDecisions(faculty?: string): Observable<Application[]> {
    let params = new HttpParams();
    if (faculty) params = params.set('faculty', faculty);
    return this.http.get<Application[]>(`${this.API_URL}/pending-board-decisions`, { params });
  }

  /**
   * Tekil Fakülte Kurulu kararı oluştur
   */
  createBoardDecision(data: {
    applicationId: string;
    decision: string;
    meetingDate?: Date;
    meetingNumber?: string;
    decisionNumber?: string;
    notes?: string;
    conditions?: string;
  }): Observable<BoardDecision> {
    return this.http.post<BoardDecision>(`${this.API_URL}/board-decision`, data);
  }

  /**
   * Toplu Fakülte Kurulu kararı oluştur
   */
  createBulkBoardDecisions(
    decisions: Array<{
      applicationId: string;
      decision: string;
      notes?: string;
      conditions?: string;
    }>,
    meetingInfo: {
      meetingDate: Date;
      meetingNumber: string;
    }
  ): Observable<any> {
    return this.http.post(`${this.API_URL}/board-decisions/bulk`, {
      decisions,
      meetingInfo,
    });
  }

  /**
   * Fakülte Kurulu kararlarını ÖİDB'ye gönder
   */
  sendDecisionsToOidb(faculty: string, applicationPeriod: string): Observable<any> {
    return this.http.post(`${this.API_URL}/board-decisions/send-to-oidb`, {
      faculty,
      applicationPeriod,
    });
  }

  /**
   * Fakülte Kurulu karar özeti
   */
  getBoardDecisionSummary(
    faculty: string,
    applicationPeriod: string
  ): Observable<{ summary: any; decisions: BoardDecision[] }> {
    const params = new HttpParams()
      .set('faculty', faculty)
      .set('applicationPeriod', applicationPeriod);
    return this.http.get<{ summary: any; decisions: BoardDecision[] }>(
      `${this.API_URL}/board-decisions/summary`,
      { params }
    );
  }

  /**
   * Bölüm bazında istatistikler
   */
  getDepartmentStatistics(
    faculty: string,
    applicationPeriod?: string
  ): Observable<DepartmentStatistics[]> {
    let params = new HttpParams().set('faculty', faculty);
    if (applicationPeriod) params = params.set('applicationPeriod', applicationPeriod);
    return this.http.get<DepartmentStatistics[]>(`${this.API_URL}/statistics/departments`, {
      params,
    });
  }

  /**
   * Kontenjan listesi
   */
  getQuotas(faculty: string, academicYear?: string): Observable<any[]> {
    let params = new HttpParams().set('faculty', faculty);
    if (academicYear) params = params.set('academicYear', academicYear);
    return this.http.get<any[]>(`${this.API_URL}/quotas`, { params });
  }

  /**
   * Kontenjan oluştur
   */
  createQuota(data: {
    department: string;
    faculty: string;
    semester: number;
    academicYear: string;
    quota: number;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/quotas`, data);
  }

  /**
   * Kontenjan güncelle
   */
  updateQuota(id: string, data: { quota?: number; filledCount?: number }): Observable<any> {
    return this.http.patch(`${this.API_URL}/quotas/${id}`, data);
  }
}
