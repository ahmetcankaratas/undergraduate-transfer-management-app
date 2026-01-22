import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation, Ranking } from '../models';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private readonly API_URL = 'http://localhost:5001/api/evaluation';

  constructor(private http: HttpClient) {}

  createEvaluation(applicationId: string): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.API_URL}/application/${applicationId}`, {});
  }

  evaluate(
    evaluationId: string,
    data: {
      verifiedGpa: number;
      verifiedOsymScore: number;
      isEnglishEligible: boolean;
      evaluationNotes?: string;
    }
  ): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.API_URL}/${evaluationId}/evaluate`, data);
  }

  getByApplication(applicationId: string): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.API_URL}/application/${applicationId}`);
  }

  generateRankings(data: {
    department: string;
    faculty: string;
    applicationPeriod: string;
    quota: number;
  }): Observable<Ranking[]> {
    return this.http.post<Ranking[]>(`${this.API_URL}/rankings/generate`, data);
  }

  getRankings(department: string, applicationPeriod: string): Observable<Ranking[]> {
    const params = new HttpParams()
      .set('department', department)
      .set('applicationPeriod', applicationPeriod);
    return this.http.get<Ranking[]>(`${this.API_URL}/rankings`, { params });
  }

  publishRankings(department: string, applicationPeriod: string): Observable<Ranking[]> {
    return this.http.post<Ranking[]>(`${this.API_URL}/rankings/publish`, {
      department,
      applicationPeriod,
    });
  }

  /**
   * OIDB için duyuruya hazır tüm sıralamaları getir
   */
  getRankingsForAnnouncement(): Observable<DepartmentRankingSummary[]> {
    return this.http.get<DepartmentRankingSummary[]>(`${this.API_URL}/rankings/for-announcement`);
  }

  /**
   * Belirli bir bölümün en son sıralamalarını getir
   */
  getLatestRankingsByDepartment(department: string): Observable<Ranking[]> {
    return this.http.get<Ranking[]>(`${this.API_URL}/rankings/latest/${encodeURIComponent(department)}`);
  }
}

export interface DepartmentRankingSummary {
  department: string;
  faculty: string;
  applicationPeriod: string;
  rankings: Ranking[];
  isPublished: boolean;
  publishedAt: Date | null;
  primaryCount: number;
  waitlistCount: number;
}
