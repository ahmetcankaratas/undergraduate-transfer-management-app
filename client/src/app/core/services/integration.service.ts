import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// External data types
export interface UbysTranscriptData {
  studentId: string;
  universityName: string;
  facultyName: string;
  departmentName: string;
  gpa: number;
  gpaScale: number;
  totalCredits: number;
  completedSemesters: number;
  enrollmentDate: string;
  courses: {
    code: string;
    name: string;
    credits: number;
    grade: string;
    semester: string;
  }[];
}

export interface OsymScoreData {
  tcKimlikNo: string;
  examYear: number;
  examType: string;
  scores: {
    scoreType: string;
    score: number;
    rank?: number;
  }[];
  placementInfo?: {
    university: string;
    faculty: string;
    department: string;
    year: number;
  };
}

export interface YoksisEnglishData {
  tcKimlikNo: string;
  examType: string;
  score: number;
  examDate: string;
  validUntil: string;
  isExempt: boolean;
  exemptionReason?: string;
}

export interface EDevletIdentityData {
  tcKimlikNo: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  gender: string;
  nationality: string;
  motherName: string;
  fatherName: string;
  documentType: string;
  documentNo: string;
  issueDate: string;
  validUntil: string;
}

export interface ExternalDocumentData {
  source: 'UBYS' | 'OSYM' | 'YOKSIS' | 'EDEVLET';
  type: 'TRANSCRIPT' | 'OSYM_RESULT' | 'ENGLISH_PROFICIENCY' | 'IDENTITY';
  data: UbysTranscriptData | OsymScoreData | YoksisEnglishData | EDevletIdentityData;
  fetchedAt: Date;
  isValid: boolean;
  validationMessage?: string;
}

export interface University {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  private readonly API_URL = 'http://localhost:5001/api/integrations';

  constructor(private http: HttpClient) {}

  getUniversities(): Observable<University[]> {
    return this.http.get<University[]>(`${this.API_URL}/universities`);
  }

  fetchTranscript(tcKimlikNo: string, universityCode: string): Observable<ExternalDocumentData> {
    return this.http.post<ExternalDocumentData>(`${this.API_URL}/ubys/transcript`, {
      tcKimlikNo,
      universityCode,
    });
  }

  fetchOsymScore(tcKimlikNo: string, examYear: number): Observable<ExternalDocumentData> {
    return this.http.post<ExternalDocumentData>(`${this.API_URL}/osym/score`, {
      tcKimlikNo,
      examYear,
    });
  }

  fetchEnglishCert(tcKimlikNo: string): Observable<ExternalDocumentData> {
    return this.http.post<ExternalDocumentData>(`${this.API_URL}/yoksis/english`, {
      tcKimlikNo,
    });
  }

  fetchIdentity(tcKimlikNo: string): Observable<ExternalDocumentData> {
    return this.http.post<ExternalDocumentData>(`${this.API_URL}/edevlet/identity`, {
      tcKimlikNo,
    });
  }

  fetchAllDocuments(
    tcKimlikNo: string,
    universityCode: string,
    examYear: number,
  ): Observable<ExternalDocumentData[]> {
    return this.http.post<ExternalDocumentData[]>(`${this.API_URL}/fetch-all`, {
      tcKimlikNo,
      universityCode,
      examYear,
    });
  }
}
