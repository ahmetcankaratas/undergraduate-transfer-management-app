import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  UbysTranscriptData,
  OsymScoreData,
  YoksisEnglishData,
  EDevletIdentityData,
  ExternalDocumentData,
} from './dto/external-data.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IntegrationsService {
  // Simulated delay for API calls (ms)
  private readonly API_DELAY = 500;

  constructor(private readonly notificationsService: NotificationsService) {}

  // Mock university codes
  private readonly UNIVERSITIES: Record<string, string> = {
    'ITU': 'İstanbul Teknik Üniversitesi',
    'BOUN': 'Boğaziçi Üniversitesi',
    'METU': 'Orta Doğu Teknik Üniversitesi',
    'HACETTEPE': 'Hacettepe Üniversitesi',
    'ANKARA': 'Ankara Üniversitesi',
    'EGE': 'Ege Üniversitesi',
    'DOKUZ_EYLUL': 'Dokuz Eylül Üniversitesi',
    'GAZI': 'Gazi Üniversitesi',
    'YILDIZ': 'Yıldız Teknik Üniversitesi',
    'MARMARA': 'Marmara Üniversitesi',
  };

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Validate TC Kimlik No (Turkish ID number)
  private validateTcKimlikNo(tcKimlikNo: string): boolean {
    if (!tcKimlikNo || tcKimlikNo.length !== 11) return false;
    if (!/^\d+$/.test(tcKimlikNo)) return false;
    if (tcKimlikNo[0] === '0') return false;
    return true;
  }

  // Generate mock transcript from UBYS
  async fetchTranscriptFromUbys(
    tcKimlikNo: string,
    universityCode: string,
    userId?: string,
  ): Promise<ExternalDocumentData> {
    await this.delay(this.API_DELAY);

    if (!this.validateTcKimlikNo(tcKimlikNo)) {
      throw new BadRequestException('Geçersiz TC Kimlik Numarası');
    }

    const universityName = this.UNIVERSITIES[universityCode];
    if (!universityName) {
      throw new NotFoundException('Üniversite bulunamadı');
    }

    // Generate mock data based on TC number for consistency
    // GPA: Always generate between 2.80 - 4.00 to meet eligibility (min 2.50)
    const seed = parseInt(tcKimlikNo.slice(-4));
    const gpa = 2.8 + (seed % 120) / 100; // GPA between 2.80 - 4.00

    const mockTranscript: UbysTranscriptData = {
      studentId: `${universityCode}-${tcKimlikNo.slice(-6)}`,
      universityName,
      facultyName: 'Mühendislik Fakültesi',
      departmentName: 'Bilgisayar Mühendisliği',
      gpa: parseFloat(gpa.toFixed(2)),
      gpaScale: 4.0,
      totalCredits: 120 + (seed % 30),
      completedSemesters: 4 + (seed % 4),
      enrollmentDate: `${2020 + (seed % 4)}-09-01`,
      courses: this.generateMockCourses(seed),
    };

    const result: ExternalDocumentData = {
      source: 'UBYS',
      type: 'TRANSCRIPT',
      data: mockTranscript,
      fetchedAt: new Date(),
      isValid: mockTranscript.gpa >= 2.5,
      validationMessage:
        mockTranscript.gpa >= 2.5
          ? 'GPA yeterlilik şartını karşılıyor (≥2.50)'
          : 'GPA yeterlilik şartını karşılamıyor (<2.50)',
    };

    // Send notification
    if (userId) {
      await this.notificationsService.notifyDocumentFetched(
        userId,
        result.source,
        result.type,
        result.isValid,
      );
    }

    return result;
  }

  // Generate mock ÖSYM score
  async fetchOsymScore(
    tcKimlikNo: string,
    examYear: number,
    userId?: string,
  ): Promise<ExternalDocumentData> {
    await this.delay(this.API_DELAY);

    if (!this.validateTcKimlikNo(tcKimlikNo)) {
      throw new BadRequestException('Geçersiz TC Kimlik Numarası');
    }

    const currentYear = new Date().getFullYear();
    if (examYear < currentYear - 5 || examYear > currentYear) {
      throw new BadRequestException('Geçersiz sınav yılı');
    }

    const seed = parseInt(tcKimlikNo.slice(-4));
    // Generate competitive scores (350-500 range for SAY - typical engineering program scores)
    const baseScore = 350 + (seed % 150);

    // Generate ranks that are within eligibility limits (max 300k for engineering, 250k for architecture)
    // Keep ranks between 50k-180k to be safely eligible
    const baseRank = 50000 + (seed % 130000); // 50,000 - 180,000 range

    const mockOsymData: OsymScoreData = {
      tcKimlikNo,
      examYear,
      examType: 'YKS',
      scores: [
        {
          scoreType: 'TYT',
          score: parseFloat((baseScore * 0.85 + (seed % 30)).toFixed(3)),
          rank: Math.floor(baseRank * 1.2), // TYT rank slightly higher
        },
        {
          scoreType: 'SAY',
          score: parseFloat((baseScore + (seed % 40)).toFixed(3)),
          rank: baseRank, // SAY rank - the one used for engineering transfers
        },
        {
          scoreType: 'EA',
          score: parseFloat((baseScore * 0.92 + (seed % 35)).toFixed(3)),
          rank: Math.floor(baseRank * 1.1),
        },
      ],
      placementInfo: {
        university: this.UNIVERSITIES['ITU'],
        faculty: 'Mühendislik Fakültesi',
        department: 'Bilgisayar Mühendisliği',
        year: examYear,
      },
    };

    const sayScore = mockOsymData.scores.find((s) => s.scoreType === 'SAY')?.score || 0;

    const result: ExternalDocumentData = {
      source: 'OSYM',
      type: 'OSYM_RESULT',
      data: mockOsymData,
      fetchedAt: new Date(),
      isValid: sayScore > 0,
      validationMessage: `${examYear} YKS SAY puanı: ${sayScore.toFixed(3)}`,
    };

    // Send notification
    if (userId) {
      await this.notificationsService.notifyDocumentFetched(
        userId,
        result.source,
        result.type,
        result.isValid,
      );
    }

    return result;
  }

  // Generate mock English proficiency from YOKSIS
  async fetchEnglishCertFromYoksis(
    tcKimlikNo: string,
    userId?: string,
  ): Promise<ExternalDocumentData> {
    await this.delay(this.API_DELAY);

    if (!this.validateTcKimlikNo(tcKimlikNo)) {
      throw new BadRequestException('Geçersiz TC Kimlik Numarası');
    }

    // Demo için sabit YDS 90 puanı kullan - tüm adaylar İngilizce yeterliliğini karşılasın
    const selectedExam = 'YDS';
    const score = 90; // YDS 90 puan (min 65 gerekli, bu yeterli)
    const isExempt = true;
    const exemptionReason = 'YDS sınav puanı (90) İngilizce yeterlilik şartını karşılıyor';

    const seed = parseInt(tcKimlikNo.slice(-4));

    const examDate = new Date();
    examDate.setMonth(examDate.getMonth() - (seed % 24));

    const validUntil = new Date(examDate);
    validUntil.setFullYear(validUntil.getFullYear() + 5);

    const mockEnglishData: YoksisEnglishData = {
      tcKimlikNo,
      examType: selectedExam,
      score: parseFloat(score.toFixed(1)),
      examDate: examDate.toISOString().split('T')[0],
      validUntil: validUntil.toISOString().split('T')[0],
      isExempt,
      exemptionReason,
    };

    const result: ExternalDocumentData = {
      source: 'YOKSIS',
      type: 'ENGLISH_PROFICIENCY',
      data: mockEnglishData,
      fetchedAt: new Date(),
      isValid: isExempt,
      validationMessage: isExempt
        ? `${selectedExam} puanı (${score}) İngilizce yeterlilik şartını karşılıyor`
        : `${selectedExam} puanı (${score}) İngilizce yeterlilik şartını karşılamıyor`,
    };

    // Send notification
    if (userId) {
      await this.notificationsService.notifyDocumentFetched(
        userId,
        result.source,
        result.type,
        result.isValid,
      );
    }

    return result;
  }

  // Generate mock identity from e-Devlet
  async fetchIdentityFromEDevlet(
    tcKimlikNo: string,
    userId?: string,
  ): Promise<ExternalDocumentData> {
    await this.delay(this.API_DELAY);

    if (!this.validateTcKimlikNo(tcKimlikNo)) {
      throw new BadRequestException('Geçersiz TC Kimlik Numarası');
    }

    const seed = parseInt(tcKimlikNo.slice(-4));
    const firstNames = ['Ahmet', 'Mehmet', 'Ali', 'Ayşe', 'Fatma', 'Zeynep', 'Emre', 'Can', 'Elif', 'Deniz'];
    const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan'];
    const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep'];

    const birthYear = 1995 + (seed % 10);
    const birthMonth = (seed % 12) + 1;
    const birthDay = (seed % 28) + 1;

    const mockIdentityData: EDevletIdentityData = {
      tcKimlikNo,
      firstName: firstNames[seed % firstNames.length],
      lastName: lastNames[(seed + 3) % lastNames.length],
      birthDate: `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
      birthPlace: cities[seed % cities.length],
      gender: seed % 2 === 0 ? 'Erkek' : 'Kadın',
      nationality: 'T.C.',
      motherName: firstNames[(seed + 5) % firstNames.length],
      fatherName: firstNames[(seed + 7) % firstNames.length],
      documentType: 'Yeni Kimlik Kartı',
      documentNo: `A${(10000000 + seed * 1000).toString()}`,
      issueDate: '2020-01-15',
      validUntil: '2030-01-15',
    };

    const result: ExternalDocumentData = {
      source: 'EDEVLET',
      type: 'IDENTITY',
      data: mockIdentityData,
      fetchedAt: new Date(),
      isValid: true,
      validationMessage: 'Kimlik bilgileri doğrulandı',
    };

    // Send notification
    if (userId) {
      await this.notificationsService.notifyDocumentFetched(
        userId,
        result.source,
        result.type,
        result.isValid,
      );
    }

    return result;
  }

  // Fetch all documents at once
  async fetchAllDocuments(
    tcKimlikNo: string,
    universityCode: string,
    examYear: number,
    userId?: string,
  ): Promise<ExternalDocumentData[]> {
    const results: ExternalDocumentData[] = [];

    // Don't send individual notifications when fetching all - we'll send a summary
    try {
      const transcript = await this.fetchTranscriptFromUbys(tcKimlikNo, universityCode);
      results.push(transcript);
    } catch (error) {
      // Continue with other fetches
    }

    try {
      const osymScore = await this.fetchOsymScore(tcKimlikNo, examYear);
      results.push(osymScore);
    } catch (error) {
      // Continue with other fetches
    }

    try {
      const englishCert = await this.fetchEnglishCertFromYoksis(tcKimlikNo);
      results.push(englishCert);
    } catch (error) {
      // Continue with other fetches
    }

    try {
      const identity = await this.fetchIdentityFromEDevlet(tcKimlikNo);
      results.push(identity);
    } catch (error) {
      // Continue with other fetches
    }

    // Send summary notification
    if (userId && results.length > 0) {
      const validCount = results.filter((r) => r.isValid).length;
      await this.notificationsService.notifyAllDocumentsFetched(
        userId,
        validCount,
        results.length,
      );
    }

    return results;
  }

  // Get available universities
  getUniversities(): { code: string; name: string }[] {
    return Object.entries(this.UNIVERSITIES).map(([code, name]) => ({
      code,
      name,
    }));
  }

  // Helper to generate mock courses
  private generateMockCourses(seed: number): { code: string; name: string; credits: number; grade: string; semester: string }[] {
    const courseNames = [
      'Matematik I', 'Matematik II', 'Fizik I', 'Fizik II',
      'Programlama I', 'Programlama II', 'Veri Yapıları',
      'Algoritmalar', 'Veritabanı Sistemleri', 'Bilgisayar Ağları',
      'İşletim Sistemleri', 'Yazılım Mühendisliği', 'Yapay Zeka',
      'Makine Öğrenmesi', 'Web Programlama', 'Mobil Uygulama Geliştirme',
    ];

    const grades = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD'];
    const semesters = ['2021-Güz', '2022-Bahar', '2022-Güz', '2023-Bahar', '2023-Güz', '2024-Bahar'];

    const numCourses = 8 + (seed % 8);
    const courses: { code: string; name: string; credits: number; grade: string; semester: string }[] = [];

    for (let i = 0; i < numCourses; i++) {
      courses.push({
        code: `CS${100 + i * 10 + (seed % 5)}`,
        name: courseNames[i % courseNames.length],
        credits: 3 + (i % 3),
        grade: grades[(seed + i) % grades.length],
        semester: semesters[i % semesters.length],
      });
    }

    return courses;
  }
}
