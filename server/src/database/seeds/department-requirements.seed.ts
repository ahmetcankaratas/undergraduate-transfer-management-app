/**
 * Bölüm Özel Şartları Seed Data
 * Kaynak: İYTE Kurum İçi ve Kurumlar Arası Yatay Geçiş Özel Şartları
 */

export const DEPARTMENT_REQUIREMENTS = [
  // İnşaat Mühendisliği
  {
    department: 'İnşaat Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    requirementType: 'COURSE_GRADE',
    courseName: 'Fizik',
    minimumGrade: 'BB',
    description: 'Fizik derslerinden en az BB notu almış olmak',
    descriptionEn: 'Must have received at least BB from Physics courses',
    requiresPortfolio: false,
  },
  {
    department: 'İnşaat Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    requirementType: 'COURSE_GRADE',
    courseName: 'Matematik',
    minimumGrade: 'BB',
    description: 'Matematik derslerinden en az BB notu almış olmak',
    descriptionEn: 'Must have received at least BB from Mathematics courses',
    requiresPortfolio: false,
  },

  // Mimarlık
  {
    department: 'Mimarlık',
    faculty: 'Mimarlık Fakültesi',
    requirementType: 'COURSE_GRADE',
    courseName: 'Tasarım',
    minimumGrade: 'AA',
    description: 'En son aldığı tasarım dersi notunun AA olması gerekmektedir',
    descriptionEn: 'Must have earned AA from their last design class',
    requiresPortfolio: false,
  },
  {
    department: 'Mimarlık',
    faculty: 'Mimarlık Fakültesi',
    requirementType: 'PORTFOLIO',
    courseName: null,
    minimumGrade: null,
    description: 'Tasarım yapı (Architectural Design - BTS) ders grupları ile ilgili geçmiş çalışmalarını gösteren portfolyo',
    descriptionEn: 'Portfolio showing work related to Architectural Design classes',
    requiresPortfolio: true,
  },

  // Endüstriyel Tasarım
  {
    department: 'Endüstriyel Tasarım',
    faculty: 'Mimarlık Fakültesi',
    requirementType: 'COURSE_GRADE',
    courseName: 'Tasarım Stüdyosu',
    minimumGrade: 'AA',
    description: 'En son aldıkları tasarım stüdyosu ders notunun AA olması gerekmektedir',
    descriptionEn: 'Must have earned AA from their last design studio course',
    requiresPortfolio: false,
  },
];

/**
 * Program Taban Puanları Seed Data (Örnek - 2024 yılı)
 * Gerçek veriler ÖSYM'den alınmalıdır
 */
export const PROGRAM_BASE_SCORES = [
  // Mühendislik Fakültesi
  {
    department: 'Bilgisayar Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 450.5,
    baseRank: 25000,
    scoreType: 'SAY',
  },
  {
    department: 'Elektrik-Elektronik Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 420.3,
    baseRank: 45000,
    scoreType: 'SAY',
  },
  {
    department: 'Makine Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 400.2,
    baseRank: 65000,
    scoreType: 'SAY',
  },
  {
    department: 'İnşaat Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 380.5,
    baseRank: 85000,
    scoreType: 'SAY',
  },
  {
    department: 'Kimya Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 370.8,
    baseRank: 95000,
    scoreType: 'SAY',
  },
  {
    department: 'Malzeme Bilimi ve Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 360.2,
    baseRank: 110000,
    scoreType: 'SAY',
  },
  {
    department: 'Biyomühendislik',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 390.4,
    baseRank: 75000,
    scoreType: 'SAY',
  },
  {
    department: 'Gıda Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 350.1,
    baseRank: 120000,
    scoreType: 'SAY',
  },
  {
    department: 'Çevre Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 340.5,
    baseRank: 140000,
    scoreType: 'SAY',
  },
  {
    department: 'Enerji Sistemleri Mühendisliği',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 385.6,
    baseRank: 80000,
    scoreType: 'SAY',
  },
  {
    department: 'Fotonik',
    faculty: 'Mühendislik Fakültesi',
    year: 2024,
    baseScore: 375.3,
    baseRank: 90000,
    scoreType: 'SAY',
  },

  // Mimarlık Fakültesi
  {
    department: 'Mimarlık',
    faculty: 'Mimarlık Fakültesi',
    year: 2024,
    baseScore: 410.7,
    baseRank: 55000,
    scoreType: 'SAY',
  },
  {
    department: 'Şehir ve Bölge Planlama',
    faculty: 'Mimarlık Fakültesi',
    year: 2024,
    baseScore: 330.2,
    baseRank: 160000,
    scoreType: 'EA',
  },
  {
    department: 'Endüstriyel Tasarım',
    faculty: 'Mimarlık Fakültesi',
    year: 2024,
    baseScore: 350.8,
    baseRank: 125000,
    scoreType: 'SAY',
  },

  // Fen Fakültesi
  {
    department: 'Fizik',
    faculty: 'Fen Fakültesi',
    year: 2024,
    baseScore: 320.5,
    baseRank: 180000,
    scoreType: 'SAY',
  },
  {
    department: 'Kimya',
    faculty: 'Fen Fakültesi',
    year: 2024,
    baseScore: 310.3,
    baseRank: 200000,
    scoreType: 'SAY',
  },
  {
    department: 'Matematik',
    faculty: 'Fen Fakültesi',
    year: 2024,
    baseScore: 340.8,
    baseRank: 150000,
    scoreType: 'SAY',
  },
  {
    department: 'Moleküler Biyoloji ve Genetik',
    faculty: 'Fen Fakültesi',
    year: 2024,
    baseScore: 380.2,
    baseRank: 88000,
    scoreType: 'SAY',
  },
];

/**
 * Örnek Kontenjanlar (2024-2025)
 */
export const QUOTAS = [
  // Mühendislik Fakültesi - 3. Yarıyıl
  { department: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 3, academicYear: '2024-2025', quota: 5 },
  { department: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 3, academicYear: '2024-2025', quota: 5 },
  { department: 'Makine Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 3, academicYear: '2024-2025', quota: 5 },
  { department: 'İnşaat Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 3, academicYear: '2024-2025', quota: 5 },
  { department: 'Kimya Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 3, academicYear: '2024-2025', quota: 3 },

  // Mühendislik Fakültesi - 5. Yarıyıl
  { department: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 5, academicYear: '2024-2025', quota: 3 },
  { department: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 5, academicYear: '2024-2025', quota: 3 },
  { department: 'Makine Mühendisliği', faculty: 'Mühendislik Fakültesi', semester: 5, academicYear: '2024-2025', quota: 3 },

  // Mimarlık Fakültesi
  { department: 'Mimarlık', faculty: 'Mimarlık Fakültesi', semester: 3, academicYear: '2024-2025', quota: 3 },
  { department: 'Mimarlık', faculty: 'Mimarlık Fakültesi', semester: 5, academicYear: '2024-2025', quota: 2 },
  { department: 'Endüstriyel Tasarım', faculty: 'Mimarlık Fakültesi', semester: 3, academicYear: '2024-2025', quota: 2 },
];
