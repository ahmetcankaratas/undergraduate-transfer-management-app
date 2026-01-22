import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    grade?: string;
    type: 'PREVIOUS' | 'TARGET';
    institution?: string;
}

export interface CourseEquivalence {
    id: string;
    sourceCourse: Course;
    targetCourse: Course;
    isMatch: boolean;
    notes?: string;
}

export interface IntibakTable {
    id: string;
    applicationId: string;
    equivalences: CourseEquivalence[];
    isApproved: boolean;
    approvedBy?: string;
    finalizedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class IntibakService {
    private readonly API_URL = 'http://localhost:5001/api/intibak';

    constructor(private http: HttpClient) {}

    createTable(applicationId: string): Observable<IntibakTable> {
        return this.http.post<IntibakTable>(`${this.API_URL}/application/${applicationId}`, {});
    }

    getTable(applicationId: string): Observable<IntibakTable> {
        return this.http.get<IntibakTable>(`${this.API_URL}/application/${applicationId}`);
    }

    addEquivalence(tableId: string, data: { sourceCourseId: string; targetCourseId: string; isMatch: boolean; notes?: string }): Observable<CourseEquivalence> {
        return this.http.post<CourseEquivalence>(`${this.API_URL}/${tableId}/equivalence`, data);
    }

    removeEquivalence(equivalenceId: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/equivalence/${equivalenceId}`);
    }

    approveTable(tableId: string): Observable<IntibakTable> {
        return this.http.post<IntibakTable>(`${this.API_URL}/${tableId}/approve`, {});
    }
}
