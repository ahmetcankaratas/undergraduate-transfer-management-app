import { Student } from './user.model';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  OIDB_REVIEW = 'OIDB_REVIEW',
  FACULTY_ROUTING = 'FACULTY_ROUTING',
  DEPARTMENT_ROUTING = 'DEPARTMENT_ROUTING',
  YGK_EVALUATION = 'YGK_EVALUATION',
  RANKED = 'RANKED',
  FACULTY_BOARD = 'FACULTY_BOARD',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLISTED = 'WAITLISTED',
}

export enum DocumentType {
  TRANSCRIPT = 'TRANSCRIPT',
  OSYM_RESULT = 'OSYM_RESULT',
  ENGLISH_PROFICIENCY = 'ENGLISH_PROFICIENCY',
  IDENTITY = 'IDENTITY',
  STUDENT_CERTIFICATE = 'STUDENT_CERTIFICATE',
  COURSE_CONTENTS = 'COURSE_CONTENTS',
  OSYM_PLACEMENT = 'OSYM_PLACEMENT',
  INTIBAK = 'INTIBAK',
  OTHER = 'OTHER',
}

export interface Application {
  id: string;
  studentId: string;
  student?: Student & { user?: { firstName: string; lastName: string; email: string } };
  applicationNumber: string;
  status: ApplicationStatus;
  targetFaculty: string;
  targetDepartment: string;
  applicationPeriod?: string;
  declaredGpa?: number;
  declaredOsymScore?: number;
  declaredOsymRank?: number;
  declaredOsymYear?: number;
  notes?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  routedToFacultyAt?: Date;
  routedToDepartmentAt?: Date;
  facultyBoardDecision?: string;
  facultyBoardDecisionAt?: Date;
  rejectionReason?: string;
  documents?: Document[];
  evaluations?: Evaluation[];
  rankings?: Ranking[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  applicationId: string;
  type: DocumentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  applicationId: string;
  evaluatorId: string;
  verifiedGpa?: number;
  verifiedOsymScore?: number;
  compositeScore?: number;
  isGpaEligible: boolean;
  isOsymEligible: boolean;
  isEnglishEligible: boolean;
  isOverallEligible: boolean;
  eligibilityNotes?: string;
  evaluationNotes?: string;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface Ranking {
  id: string;
  applicationId: string;
  application?: Application;
  department: string;
  faculty: string;
  applicationPeriod: string;
  rank: number;
  score: number;
  isPrimary: boolean;
  isWaitlisted: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  quota?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: Date;
  applicationId?: string;
  link?: string;
  createdAt: Date;
}

export interface CreateApplicationDto {
  targetFaculty: string;
  targetDepartment: string;
  applicationPeriod?: string;
  declaredGpa: number;
  declaredOsymScore: number;
  declaredOsymRank: number;
  declaredOsymYear?: number;
  notes?: string;
}
