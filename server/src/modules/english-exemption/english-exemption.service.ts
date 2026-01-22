import { Injectable, Logger } from '@nestjs/common';

/**
 * İYTE Yabancı Diller Yüksekokulu Entegrasyonu (Mock)
 * Yönerge MADDE 8: İYTE Temel İngilizce Bölümü Hazırlık Sınıfı muafiyeti
 *
 * Muafiyet koşulları:
 * 1. %100 İngilizce eğitim veren üniversiteden gelme
 * 2. Ulusal/uluslararası İngilizce sınav sonucu (TOEFL, IELTS, YDS, YÖKDİL vb.)
 * 3. İYTE İngilizce Yeterlilik Sınavı
 */

export interface EnglishExemptionResult {
  isExempt: boolean;
  exemptionType?: string;
  exemptionReason?: string;
  examScore?: number;
  examType?: string;
  examDate?: Date;
  validUntil?: Date;
}

export interface EnglishExamScore {
  examType: string; // TOEFL_IBT, IELTS, YDS, YOKDIL, IYTE_EPE
  score: number;
  date: Date;
}

// Minimum score requirements for exemption
const MINIMUM_SCORES: Record<string, number> = {
  TOEFL_IBT: 79,
  TOEFL_PBT: 550,
  IELTS: 6.5,
  YDS: 65,
  YOKDIL: 65,
  IYTE_EPE: 65, // İYTE English Proficiency Exam
  PEARSON_PTE: 55,
  CAMBRIDGE_CAE: 176,
  CAMBRIDGE_CPE: 180,
};

@Injectable()
export class EnglishExemptionService {
  private readonly logger = new Logger(EnglishExemptionService.name);

  /**
   * Check if a student is exempt from English preparatory class
   * This is a mock implementation - in production, would integrate with İYTE Yabancı Diller YO system
   */
  async checkExemptionStatus(
    studentId: string,
    tcKimlikNo?: string,
  ): Promise<EnglishExemptionResult> {
    this.logger.log(`Checking English exemption for student: ${studentId}`);

    // Mock: In production, this would call İYTE Yabancı Diller YO API
    // For now, return a mock result

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock response - in production would be real data
    return {
      isExempt: false, // Default to not exempt - needs verification
      exemptionType: undefined,
      exemptionReason: 'Muafiyet durumu doğrulanmadı',
    };
  }

  /**
   * Verify exam score for exemption
   */
  async verifyExamScore(examData: EnglishExamScore): Promise<EnglishExemptionResult> {
    const minimumScore = MINIMUM_SCORES[examData.examType];

    if (!minimumScore) {
      return {
        isExempt: false,
        exemptionReason: `Geçersiz sınav türü: ${examData.examType}`,
      };
    }

    // Check if exam date is within valid period (2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    if (examData.date < twoYearsAgo) {
      return {
        isExempt: false,
        examType: examData.examType,
        examScore: examData.score,
        examDate: examData.date,
        exemptionReason: 'Sınav sonucu geçerlilik süresi dolmuş (2 yıl)',
      };
    }

    const isExempt = examData.score >= minimumScore;

    // Calculate valid until date (2 years from exam date)
    const validUntil = new Date(examData.date);
    validUntil.setFullYear(validUntil.getFullYear() + 2);

    return {
      isExempt,
      exemptionType: isExempt ? 'EXAM_SCORE' : undefined,
      exemptionReason: isExempt
        ? `${examData.examType} sınavından ${examData.score} puan ile muafiyet sağlandı`
        : `${examData.examType} puanı (${examData.score}) minimum gereksinimi (${minimumScore}) karşılamıyor`,
      examScore: examData.score,
      examType: examData.examType,
      examDate: examData.date,
      validUntil: isExempt ? validUntil : undefined,
    };
  }

  /**
   * Check if student comes from 100% English medium university
   */
  async checkUniversityMedium(
    universityName: string,
    programName: string,
  ): Promise<EnglishExemptionResult> {
    // List of known 100% English medium universities/programs in Turkey
    const englishMediumUniversities = [
      'Boğaziçi Üniversitesi',
      'Orta Doğu Teknik Üniversitesi',
      'ODTÜ',
      'Bilkent Üniversitesi',
      'Koç Üniversitesi',
      'Sabancı Üniversitesi',
      'İzmir Yüksek Teknoloji Enstitüsü',
      'İYTE',
    ];

    const isEnglishMedium = englishMediumUniversities.some(
      (uni) =>
        universityName.toLowerCase().includes(uni.toLowerCase()) ||
        uni.toLowerCase().includes(universityName.toLowerCase()),
    );

    return {
      isExempt: isEnglishMedium,
      exemptionType: isEnglishMedium ? 'ENGLISH_MEDIUM_UNIVERSITY' : undefined,
      exemptionReason: isEnglishMedium
        ? `${universityName} %100 İngilizce eğitim veren üniversite olarak kabul edildi`
        : `${universityName} %100 İngilizce eğitim veren üniversite listesinde bulunamadı`,
    };
  }

  /**
   * Get minimum score requirements for all exam types
   */
  getMinimumScoreRequirements(): Record<string, number> {
    return { ...MINIMUM_SCORES };
  }

  /**
   * Validate exam type
   */
  isValidExamType(examType: string): boolean {
    return examType in MINIMUM_SCORES;
  }
}
