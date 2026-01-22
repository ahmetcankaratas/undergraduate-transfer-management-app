import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application, CreateApplicationDto, ApplicationStatus } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private readonly API_URL = 'http://localhost:5001/api/applications';

  constructor(private http: HttpClient) {}

  create(data: CreateApplicationDto): Observable<Application> {
    return this.http.post<Application>(this.API_URL, data);
  }

  getAll(filters?: {
    status?: ApplicationStatus;
    targetFaculty?: string;
    targetDepartment?: string;
    applicationPeriod?: string;
    searchTerm?: string;
  }): Observable<Application[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<Application[]>(this.API_URL, { params });
  }

  /**
   * Get current user's applications (for students)
   * Same as getAll but explicitly returns user's own applications with rankings
   */
  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(this.API_URL);
  }

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.API_URL}/${id}`);
  }

  update(id: string, data: Partial<Application>): Observable<Application> {
    return this.http.patch<Application>(`${this.API_URL}/${id}`, data);
  }

  submit(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/${id}/submit`, {});
  }

  review(id: string, approved: boolean, notes?: string): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/${id}/review`, { approved, notes });
  }

  routeToFaculty(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/${id}/route-to-faculty`, {});
  }

  routeToDepartment(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/${id}/route-to-department`, {});
  }

  setForEvaluation(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/${id}/set-for-evaluation`, {});
  }

  setFacultyBoardDecision(id: string, decision: string, notes?: string): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/${id}/faculty-board-decision`, {
      decision,
      notes,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getStatistics(): Observable<{
    total: number;
    byStatus: { status: string; count: number }[];
    byFaculty: { faculty: string; count: number }[];
  }> {
    return this.http.get<any>(`${this.API_URL}/statistics`);
  }
}
