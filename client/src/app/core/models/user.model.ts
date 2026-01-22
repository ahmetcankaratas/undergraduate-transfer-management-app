export enum UserRole {
  STUDENT = 'STUDENT',
  OIDB_STAFF = 'OIDB_STAFF',
  FACULTY_STAFF = 'FACULTY_STAFF',
  YGK_MEMBER = 'YGK_MEMBER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  student?: Student;
  staff?: Staff;
}

export interface Student {
  id: string;
  userId: string;
  tcKimlikNo?: string;
  phone?: string;
  currentUniversity?: string;
  currentDepartment?: string;
  currentFaculty?: string;
  gpa?: number;
  osymScore?: number;
  osymYear?: number;
  englishProficiencyType?: string;
  englishProficiencyScore?: string;
  hasEnglishExemption: boolean;
}

export interface Staff {
  id: string;
  userId: string;
  department?: string;
  faculty?: string;
  title?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
