// UBYS (Üniversite Bilgi Yönetim Sistemi) - Transkript verisi
export interface UbysTranscriptData {
  studentId: string;
  universityName: string;
  facultyName: string;
  departmentName: string;
  gpa: number;
  gpaScale: number; // 4.0 or 100
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

// ÖSYM Sınav Sonuçları
export interface OsymScoreData {
  tcKimlikNo: string;
  examYear: number;
  examType: string; // YKS, TYT, AYT, etc.
  scores: {
    scoreType: string; // SAY, EA, SÖZ, DİL, TYT
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

// YOKSIS - İngilizce Yeterlilik
export interface YoksisEnglishData {
  tcKimlikNo: string;
  examType: string; // YDS, YÖKDİL, TOEFL, IELTS, etc.
  score: number;
  examDate: string;
  validUntil: string;
  isExempt: boolean;
  exemptionReason?: string;
}

// e-Devlet - Kimlik Bilgileri
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

// Fetch request DTOs
export class FetchTranscriptDto {
  tcKimlikNo: string;
  universityCode: string;
}

export class FetchOsymScoreDto {
  tcKimlikNo: string;
  examYear: number;
}

export class FetchEnglishCertDto {
  tcKimlikNo: string;
}

export class FetchIdentityDto {
  tcKimlikNo: string;
}

// Combined external data response
export interface ExternalDocumentData {
  source: 'UBYS' | 'OSYM' | 'YOKSIS' | 'EDEVLET';
  type: 'TRANSCRIPT' | 'OSYM_RESULT' | 'ENGLISH_PROFICIENCY' | 'IDENTITY';
  data: UbysTranscriptData | OsymScoreData | YoksisEnglishData | EDevletIdentityData;
  fetchedAt: Date;
  isValid: boolean;
  validationMessage?: string;
}
