import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application } from '../../../core/models';

export interface DepartmentSummary {
    department: string;
    faculty: string;
    count: number;
}

export interface Ranking {
    id: string;
    applicationId: string;
    department: string;
    faculty: string;
    applicationPeriod: string;
    rank: number;
    score: number;
    isPrimary: boolean;
    isWaitlisted: boolean;
    isPublished: boolean;
    publishedAt?: Date;
    quota: number;
    application?: Application;
}

export interface Evaluation {
    id: string;
    applicationId: string;
    evaluatorId: string;
    verifiedGpa?: number;
    verifiedGpa100?: number;
    verifiedOsymScore?: number;
    verifiedOsymRank?: number;
    verifiedOsymYear?: number;
    programBaseScore?: number;
    compositeScore?: number;
    isGpaEligible?: boolean;
    isOsymEligible?: boolean;
    isOsymRankEligible?: boolean;
    isEnglishEligible?: boolean;
    isIyteEnglishExempt?: boolean;
    isDepartmentRequirementsMet?: boolean;
    departmentRequirementsNotes?: string;
    isOverallEligible?: boolean;
    eligibilityNotes?: string;
    evaluationNotes?: string;
    isCompleted: boolean;
    completedAt?: Date;
}

export interface YgkStatistics {
    pendingEvaluations: number;
    completedEvaluations: number;
    byStatus: Array<{ status: string; count: number }>;
}

@Injectable({
    providedIn: 'root'
})
export class YgkService {
    private readonly API_URL = 'http://localhost:5001/api/ygk';

    constructor(private http: HttpClient) {}

    /**
     * Get pending applications for YGK evaluation
     */
    getPendingApplications(department?: string, faculty?: string): Observable<Application[]> {
        let url = `${this.API_URL}/pending`;
        const params: string[] = [];

        if (department) params.push(`department=${encodeURIComponent(department)}`);
        if (faculty) params.push(`faculty=${encodeURIComponent(faculty)}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<Application[]>(url);
    }

    /**
     * Get departments with pending applications
     */
    getPendingDepartments(): Observable<DepartmentSummary[]> {
        return this.http.get<DepartmentSummary[]>(`${this.API_URL}/pending-departments`);
    }

    /**
     * Get application details
     */
    getApplication(id: string): Observable<{
        application: Application;
        departmentRequirements: any[];
        programBaseScore: any;
    }> {
        return this.http.get<any>(`${this.API_URL}/applications/${id}`);
    }

    /**
     * Start or get evaluation for an application
     */
    startEvaluation(applicationId: string): Observable<Evaluation> {
        return this.http.post<Evaluation>(`${this.API_URL}/applications/${applicationId}/start-evaluation`, {});
    }

    /**
     * Submit evaluation
     */
    evaluate(evaluationId: string, data: {
        verifiedGpa: number;
        verifiedOsymScore: number;
        verifiedOsymRank: number;
        verifiedOsymYear: number;
        isEnglishEligible: boolean;
        isIyteEnglishExempt: boolean;
        courseGrades?: Record<string, string>;
        hasPortfolio?: boolean;
        evaluationNotes?: string;
    }): Observable<Evaluation> {
        return this.http.post<Evaluation>(`${this.API_URL}/evaluations/${evaluationId}/evaluate`, data);
    }

    /**
     * Generate rankings for a department
     */
    generateRankings(department: string, faculty: string, applicationPeriod: string): Observable<{
        message: string;
        quota: number;
        primary: number;
        waitlisted: number;
        rankings: Ranking[];
    }> {
        return this.http.post<any>(`${this.API_URL}/rankings/generate`, {
            department,
            faculty,
            applicationPeriod
        });
    }

    /**
     * Get rankings for a department
     */
    getRankings(department: string, applicationPeriod: string): Observable<Ranking[]> {
        return this.http.get<Ranking[]>(`${this.API_URL}/rankings`, {
            params: { department, applicationPeriod }
        });
    }

    /**
     * Send rankings to Faculty Board
     */
    sendToFacultyBoard(department: string, applicationPeriod: string): Observable<{ message: string; count: number }> {
        return this.http.post<{ message: string; count: number }>(`${this.API_URL}/rankings/send-to-faculty`, {
            department,
            applicationPeriod
        });
    }

    /**
     * Get YGK statistics
     */
    getStatistics(department?: string, faculty?: string): Observable<YgkStatistics> {
        let url = `${this.API_URL}/statistics`;
        const params: string[] = [];

        if (department) params.push(`department=${encodeURIComponent(department)}`);
        if (faculty) params.push(`faculty=${encodeURIComponent(faculty)}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<YgkStatistics>(url);
    }
}
