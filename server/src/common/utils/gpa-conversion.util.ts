/**
 * YÖK GPA Dönüşüm Tablosu
 * 4'lük sistemden 100'lük sisteme dönüşüm
 * Kaynak: Yükseköğretim Yürütme Kurulu kararı
 */

interface GpaConversionEntry {
  min4: number;
  max4: number;
  value100: number;
}

// YÖK resmi dönüşüm tablosu
const YOK_GPA_CONVERSION_TABLE: GpaConversionEntry[] = [
  { min4: 4.00, max4: 4.00, value100: 100 },
  { min4: 3.90, max4: 3.99, value100: 98 },
  { min4: 3.80, max4: 3.89, value100: 96 },
  { min4: 3.70, max4: 3.79, value100: 93 },
  { min4: 3.60, max4: 3.69, value100: 91 },
  { min4: 3.50, max4: 3.59, value100: 88 },
  { min4: 3.40, max4: 3.49, value100: 86 },
  { min4: 3.30, max4: 3.39, value100: 84 },
  { min4: 3.20, max4: 3.29, value100: 81 },
  { min4: 3.10, max4: 3.19, value100: 79 },
  { min4: 3.00, max4: 3.09, value100: 77 },
  { min4: 2.90, max4: 2.99, value100: 74 },
  { min4: 2.80, max4: 2.89, value100: 72 },
  { min4: 2.70, max4: 2.79, value100: 70 },
  { min4: 2.60, max4: 2.69, value100: 67 },
  { min4: 2.50, max4: 2.59, value100: 65 },
  { min4: 2.40, max4: 2.49, value100: 63 },
  { min4: 2.30, max4: 2.39, value100: 60 },
  { min4: 2.20, max4: 2.29, value100: 58 },
  { min4: 2.10, max4: 2.19, value100: 56 },
  { min4: 2.00, max4: 2.09, value100: 53 },
  { min4: 1.90, max4: 1.99, value100: 51 },
  { min4: 1.80, max4: 1.89, value100: 49 },
  { min4: 1.70, max4: 1.79, value100: 46 },
  { min4: 1.60, max4: 1.69, value100: 44 },
  { min4: 1.50, max4: 1.59, value100: 42 },
  { min4: 1.40, max4: 1.49, value100: 39 },
  { min4: 1.30, max4: 1.39, value100: 37 },
  { min4: 1.20, max4: 1.29, value100: 35 },
  { min4: 1.10, max4: 1.19, value100: 32 },
  { min4: 1.00, max4: 1.09, value100: 30 },
  { min4: 0.00, max4: 0.99, value100: 0 },
];

/**
 * 4'lük GPA'yı 100'lük sisteme dönüştürür
 * YÖK resmi dönüşüm tablosu kullanılır
 */
export function convertGpaTo100Scale(gpa4: number): number {
  if (gpa4 < 0 || gpa4 > 4.0) {
    throw new Error(`Invalid GPA value: ${gpa4}. Must be between 0 and 4.0`);
  }

  const entry = YOK_GPA_CONVERSION_TABLE.find(
    (e) => gpa4 >= e.min4 && gpa4 <= e.max4,
  );

  if (!entry) {
    // Linear interpolation for edge cases
    return Math.round((gpa4 / 4.0) * 100);
  }

  return entry.value100;
}

/**
 * Harf notunu sayısal değere dönüştürür
 */
export function letterGradeToNumeric(grade: string): number {
  const gradeMap: Record<string, number> = {
    AA: 4.0,
    BA: 3.5,
    BB: 3.0,
    CB: 2.5,
    CC: 2.0,
    DC: 1.5,
    DD: 1.0,
    FD: 0.5,
    FF: 0.0,
  };

  return gradeMap[grade.toUpperCase()] ?? -1;
}

/**
 * Harf notunu karşılaştırır
 * grade1 >= grade2 ise true döner
 */
export function isGradeAtLeast(grade: string, minimumGrade: string): boolean {
  const g1 = letterGradeToNumeric(grade);
  const g2 = letterGradeToNumeric(minimumGrade);

  if (g1 === -1 || g2 === -1) {
    return false;
  }

  return g1 >= g2;
}
