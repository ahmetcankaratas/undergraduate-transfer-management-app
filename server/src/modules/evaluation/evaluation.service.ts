import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Evaluation,
  Application,
  Ranking,
  Staff,
  ProgramBaseScore,
  DepartmentRequirement,
} from '../../entities';
import { ApplicationStatus } from '../../common/enums';
import {
  convertGpaTo100Scale,
  isGradeAtLeast,
} from '../../common/utils/gpa-conversion.util';

/**
 * ÖSYM Sıralama Limitleri (Yönerge MADDE 6)
 */
const OSYM_RANK_LIMITS = {
  ENGINEERING: 300000, // Mühendislik programları
  ARCHITECTURE: 250000, // Mimarlık programı
};

/**
 * Fakülte türleri
 */
const FACULTY_TYPES = {
  ENGINEERING: 'Mühendislik Fakültesi',
  ARCHITECTURE: 'Mimarlık Fakültesi',
};

@Injectable()
export class EvaluationService {
  // Scoring weights (Yönerge MADDE 9)
  // Yatay geçiş puanı = (x/y * 100 * 0.9) + (z * 0.1)
  private readonly OSYM_WEIGHT = 0.9;
  private readonly GPA_WEIGHT = 0.1;
  private readonly MIN_GPA = 2.5; // Minimum GPA requirement (4.0 scale)
  private readonly MIN_GPA_100 = 70; // Minimum GPA (100 scale)

  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(ProgramBaseScore)
    private programBaseScoreRepository: Repository<ProgramBaseScore>,
    @InjectRepository(DepartmentRequirement)
    private departmentRequirementRepository: Repository<DepartmentRequirement>,
  ) {}

  /**
   * Yatay Geçiş Puanı Hesaplama (Yönerge MADDE 9-4)
   * Formül: (x/y * 100 * 0.9) + (z * 0.1)
   * x: Adayın ÖSYM puanı
   * y: Programın taban puanı
   * z: GPA (100'lük sisteme dönüştürülmüş)
   */
  private calculateTransferScore(
    osymScore: number,
    programBaseScore: number,
    gpa100: number,
  ): number {
    if (programBaseScore <= 0) {
      throw new BadRequestException('Program taban puanı geçersiz');
    }

    const osymComponent = (osymScore / programBaseScore) * 100 * this.OSYM_WEIGHT;
    const gpaComponent = gpa100 * this.GPA_WEIGHT;

    return Number((osymComponent + gpaComponent).toFixed(4));
  }

  /**
   * ÖSYM Sıralama Kontrolü (Yönerge MADDE 6-1)
   * Mühendislik: ≤ 300.000
   * Mimarlık: ≤ 250.000
   */
  private checkOsymRankEligibility(
    osymRank: number,
    faculty: string,
  ): { isEligible: boolean; limit: number; message?: string } {
    let limit: number;

    if (faculty === FACULTY_TYPES.ARCHITECTURE) {
      limit = OSYM_RANK_LIMITS.ARCHITECTURE;
    } else {
      // Default to engineering limit for all other faculties
      limit = OSYM_RANK_LIMITS.ENGINEERING;
    }

    const isEligible = osymRank <= limit;
    const message = isEligible
      ? undefined
      : `ÖSYM sıralaması (${osymRank}) ${faculty} için gerekli limitin (${limit}) üzerinde`;

    return { isEligible, limit, message };
  }

  /**
   * Bölüm özel şartlarını kontrol et
   */
  private async checkDepartmentRequirements(
    department: string,
    faculty: string,
    courseGrades?: Record<string, string>,
    hasPortfolio?: boolean,
  ): Promise<{
    isMet: boolean;
    notes: string[];
    requirements: DepartmentRequirement[];
  }> {
    const requirements = await this.departmentRequirementRepository.find({
      where: { department, faculty, isActive: true },
    });

    if (requirements.length === 0) {
      return { isMet: true, notes: [], requirements: [] };
    }

    const notes: string[] = [];
    let allMet = true;

    for (const req of requirements) {
      switch (req.requirementType) {
        case 'COURSE_GRADE':
          if (courseGrades && req.courseName && req.minimumGrade) {
            const studentGrade = courseGrades[req.courseName];
            if (!studentGrade) {
              notes.push(`${req.courseName} dersi notu bulunamadı`);
              allMet = false;
            } else if (!isGradeAtLeast(studentGrade, req.minimumGrade)) {
              notes.push(
                `${req.courseName} dersi notu (${studentGrade}) minimum ${req.minimumGrade} olmalı`,
              );
              allMet = false;
            }
          }
          break;

        case 'PORTFOLIO':
          if (req.requiresPortfolio && !hasPortfolio) {
            notes.push('Portfolio gerekli ancak yüklenmemiş');
            allMet = false;
          }
          break;

        case 'CUSTOM':
          // Custom requirements need manual verification
          notes.push(`Manuel doğrulama gerekli: ${req.description}`);
          break;
      }
    }

    return { isMet: allMet, notes, requirements };
  }

  /**
   * Program taban puanını getir
   */
  private async getProgramBaseScore(
    department: string,
    faculty: string,
    year: number,
  ): Promise<number | null> {
    const baseScore = await this.programBaseScoreRepository.findOne({
      where: { department, faculty, year, isActive: true },
    });

    return baseScore?.baseScore ?? null;
  }

  /**
   * Eligibility kontrolü
   */
  private checkEligibility(data: {
    gpa: number;
    gpa100: number;
    osymScore: number;
    osymRank: number;
    faculty: string;
    hasEnglishProficiency: boolean;
    isIyteEnglishExempt: boolean;
    isDepartmentRequirementsMet: boolean;
  }) {
    const isGpaEligible = data.gpa >= this.MIN_GPA && data.gpa100 >= this.MIN_GPA_100;
    const isOsymEligible = data.osymScore > 0;
    const osymRankCheck = this.checkOsymRankEligibility(data.osymRank, data.faculty);

    // İngilizce uygunluğu: Ya genel yeterlilik ya da İYTE muafiyeti (MADDE 8)
    const isEnglishEligible =
      data.hasEnglishProficiency || data.isIyteEnglishExempt;

    const isOverallEligible =
      isGpaEligible &&
      isOsymEligible &&
      osymRankCheck.isEligible &&
      isEnglishEligible &&
      data.isDepartmentRequirementsMet;

    return {
      isGpaEligible,
      isOsymEligible,
      isOsymRankEligible: osymRankCheck.isEligible,
      osymRankLimit: osymRankCheck.limit,
      osymRankMessage: osymRankCheck.message,
      isEnglishEligible,
      isOverallEligible,
    };
  }

  async createEvaluation(applicationId: string, evaluatorId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.YGK_EVALUATION) {
      throw new BadRequestException('Application is not ready for evaluation');
    }

    const staff = await this.staffRepository.findOne({
      where: { userId: evaluatorId },
    });

    if (!staff) {
      throw new NotFoundException('Evaluator not found');
    }

    // Check if evaluation already exists
    const existingEvaluation = await this.evaluationRepository.findOne({
      where: { applicationId, evaluatorId: staff.id },
    });

    if (existingEvaluation) {
      return existingEvaluation;
    }

    const evaluation = this.evaluationRepository.create({
      applicationId,
      evaluatorId: staff.id,
    });

    return this.evaluationRepository.save(evaluation);
  }

  async evaluate(
    id: string,
    evaluatorId: string,
    data: {
      verifiedGpa: number;
      verifiedOsymScore: number;
      verifiedOsymRank: number;
      verifiedOsymYear: number;
      isEnglishEligible: boolean;
      isIyteEnglishExempt: boolean;
      courseGrades?: Record<string, string>;
      hasPortfolio?: boolean;
      evaluationNotes?: string;
    },
  ) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['application'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    const application = evaluation.application;

    // Convert GPA to 100 scale using YÖK table
    const gpa100 = convertGpaTo100Scale(data.verifiedGpa);

    // Get program base score for the year
    const programBaseScore = await this.getProgramBaseScore(
      application.targetDepartment,
      application.targetFaculty,
      data.verifiedOsymYear,
    );

    if (!programBaseScore) {
      throw new BadRequestException(
        `${data.verifiedOsymYear} yılı için ${application.targetDepartment} programının taban puanı bulunamadı`,
      );
    }

    // Check department requirements
    const deptReqCheck = await this.checkDepartmentRequirements(
      application.targetDepartment,
      application.targetFaculty,
      data.courseGrades,
      data.hasPortfolio,
    );

    // Check all eligibility criteria
    const eligibility = this.checkEligibility({
      gpa: data.verifiedGpa,
      gpa100,
      osymScore: data.verifiedOsymScore,
      osymRank: data.verifiedOsymRank,
      faculty: application.targetFaculty,
      hasEnglishProficiency: data.isEnglishEligible,
      isIyteEnglishExempt: data.isIyteEnglishExempt,
      isDepartmentRequirementsMet: deptReqCheck.isMet,
    });

    // Calculate transfer score only if eligible
    const compositeScore = eligibility.isOverallEligible
      ? this.calculateTransferScore(data.verifiedOsymScore, programBaseScore, gpa100)
      : 0;

    // Update evaluation
    evaluation.verifiedGpa = data.verifiedGpa;
    evaluation.verifiedGpa100 = gpa100;
    evaluation.verifiedOsymScore = data.verifiedOsymScore;
    evaluation.verifiedOsymRank = data.verifiedOsymRank;
    evaluation.verifiedOsymYear = data.verifiedOsymYear;
    evaluation.programBaseScore = programBaseScore;
    evaluation.compositeScore = compositeScore;
    evaluation.isGpaEligible = eligibility.isGpaEligible;
    evaluation.isOsymEligible = eligibility.isOsymEligible;
    evaluation.isOsymRankEligible = eligibility.isOsymRankEligible;
    evaluation.isEnglishEligible = data.isEnglishEligible;
    evaluation.isIyteEnglishExempt = data.isIyteEnglishExempt;
    evaluation.isDepartmentRequirementsMet = deptReqCheck.isMet;
    evaluation.departmentRequirementsNotes = deptReqCheck.notes.join('; ');
    evaluation.isOverallEligible = eligibility.isOverallEligible;
    evaluation.evaluationNotes = data.evaluationNotes || '';
    evaluation.isCompleted = true;
    evaluation.completedAt = new Date();

    // Build eligibility notes
    const notes: string[] = [];
    if (!eligibility.isGpaEligible) {
      notes.push(
        `GPA (${data.verifiedGpa} / 100'lük: ${gpa100}) minimum gereksinimi (2.50/4.00 veya 70/100) karşılamıyor`,
      );
    }
    if (!eligibility.isOsymEligible) {
      notes.push('ÖSYM puanı eksik veya geçersiz');
    }
    if (!eligibility.isOsymRankEligible) {
      notes.push(eligibility.osymRankMessage!);
    }
    if (!eligibility.isEnglishEligible) {
      notes.push(
        'İngilizce yeterlilik şartı sağlanmadı (İYTE Hazırlık muafiyeti veya dil sınavı gerekli)',
      );
    }
    if (!deptReqCheck.isMet) {
      notes.push(...deptReqCheck.notes);
    }
    evaluation.eligibilityNotes = notes.length > 0 ? notes.join('; ') : '';

    await this.evaluationRepository.save(evaluation);

    // Update application status if not eligible
    if (!eligibility.isOverallEligible) {
      await this.applicationRepository.update(evaluation.applicationId, {
        status: ApplicationStatus.REJECTED,
        rejectionReason: evaluation.eligibilityNotes,
      });
    }

    return evaluation;
  }

  async getByApplication(applicationId: string) {
    return this.evaluationRepository.find({
      where: { applicationId },
      relations: ['evaluator', 'evaluator.user'],
    });
  }

  async generateRankings(
    department: string,
    faculty: string,
    applicationPeriod: string,
    quota: number,
  ) {
    // Get all eligible applications for this department
    const evaluations = await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.application', 'application')
      .where('application.targetDepartment = :department', { department })
      .andWhere('application.targetFaculty = :faculty', { faculty })
      .andWhere('application.applicationPeriod = :applicationPeriod', {
        applicationPeriod,
      })
      .andWhere('evaluation.isCompleted = :isCompleted', { isCompleted: true })
      .andWhere('evaluation.isOverallEligible = :isEligible', { isEligible: true })
      .orderBy('evaluation.compositeScore', 'DESC')
      .getMany();

    // Clear existing rankings for this period/department
    await this.rankingRepository.delete({
      department,
      faculty,
      applicationPeriod,
    });

    // Create rankings
    const rankings: Ranking[] = [];
    for (let i = 0; i < evaluations.length; i++) {
      const evaluation = evaluations[i];
      const rank = i + 1;
      const isPrimary = rank <= quota;
      const isWaitlisted = rank > quota;

      const ranking = this.rankingRepository.create({
        applicationId: evaluation.applicationId,
        department,
        faculty,
        applicationPeriod,
        rank,
        score: evaluation.compositeScore,
        isPrimary,
        isWaitlisted,
        quota,
      });

      rankings.push(ranking);

      // Update application status
      const newStatus = isPrimary
        ? ApplicationStatus.RANKED
        : ApplicationStatus.WAITLISTED;
      await this.applicationRepository.update(evaluation.applicationId, {
        status: newStatus,
      });
    }

    return this.rankingRepository.save(rankings);
  }

  async getRankings(department: string, applicationPeriod: string) {
    return this.rankingRepository.find({
      where: { department, applicationPeriod },
      relations: ['application', 'application.student', 'application.student.user'],
      order: { rank: 'ASC' },
    });
  }

  async publishRankings(department: string, applicationPeriod: string) {
    const rankings = await this.rankingRepository.find({
      where: { department, applicationPeriod },
      relations: ['application', 'application.student', 'application.student.user'],
    });

    for (const ranking of rankings) {
      ranking.isPublished = true;
      ranking.publishedAt = new Date();

      // Update application status to APPROVED or WAITLISTED based on isPrimary
      if (ranking.application) {
        ranking.application.status = ranking.isPrimary
          ? ApplicationStatus.APPROVED
          : ApplicationStatus.WAITLISTED;
        await this.applicationRepository.save(ranking.application);
      }
    }

    return this.rankingRepository.save(rankings);
  }

  /**
   * OIDB için duyuruya hazır sıralamaları getir
   * Dönem seçimi yok - en son dönem otomatik alınır
   */
  async getRankingsForAnnouncement() {
    // Get all rankings grouped by department, ordered by most recent
    const rankings = await this.rankingRepository
      .createQueryBuilder('ranking')
      .leftJoinAndSelect('ranking.application', 'application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('ranking.applicationPeriod', 'DESC')
      .addOrderBy('ranking.department', 'ASC')
      .addOrderBy('ranking.rank', 'ASC')
      .getMany();

    // Group by department
    const departmentMap = new Map<string, {
      department: string;
      faculty: string;
      applicationPeriod: string;
      rankings: typeof rankings;
      isPublished: boolean;
      publishedAt: Date | null;
      primaryCount: number;
      waitlistCount: number;
    }>();

    for (const ranking of rankings) {
      const key = `${ranking.department}-${ranking.applicationPeriod}`;
      if (!departmentMap.has(key)) {
        departmentMap.set(key, {
          department: ranking.department,
          faculty: ranking.faculty,
          applicationPeriod: ranking.applicationPeriod,
          rankings: [],
          isPublished: ranking.isPublished,
          publishedAt: ranking.publishedAt,
          primaryCount: 0,
          waitlistCount: 0,
        });
      }
      const dept = departmentMap.get(key)!;
      dept.rankings.push(ranking);
      if (ranking.isPrimary) {
        dept.primaryCount++;
      } else {
        dept.waitlistCount++;
      }
    }

    return Array.from(departmentMap.values());
  }

  /**
   * Belirli bir bölümün sıralamalarını getir (dönem otomatik - en son)
   */
  async getLatestRankingsByDepartment(department: string) {
    // Find the latest period for this department
    const latestRanking = await this.rankingRepository.findOne({
      where: { department },
      order: { createdAt: 'DESC' },
    });

    if (!latestRanking) {
      return [];
    }

    return this.getRankings(department, latestRanking.applicationPeriod);
  }

  // Admin methods for managing base scores and requirements
  async createProgramBaseScore(data: {
    department: string;
    faculty: string;
    year: number;
    baseScore: number;
    baseRank?: number;
    scoreType?: string;
  }) {
    const existing = await this.programBaseScoreRepository.findOne({
      where: { department: data.department, faculty: data.faculty, year: data.year },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.programBaseScoreRepository.save(existing);
    }

    const baseScore = this.programBaseScoreRepository.create(data);
    return this.programBaseScoreRepository.save(baseScore);
  }

  async getProgramBaseScores(department?: string, faculty?: string) {
    const query: any = { isActive: true };
    if (department) query.department = department;
    if (faculty) query.faculty = faculty;

    return this.programBaseScoreRepository.find({
      where: query,
      order: { year: 'DESC' },
    });
  }

  async createDepartmentRequirement(data: {
    department: string;
    faculty: string;
    requirementType: string;
    courseName?: string;
    minimumGrade?: string;
    description?: string;
    descriptionEn?: string;
    requiresPortfolio?: boolean;
  }) {
    const requirement = this.departmentRequirementRepository.create(data);
    return this.departmentRequirementRepository.save(requirement);
  }

  async getDepartmentRequirements(department: string, faculty: string) {
    return this.departmentRequirementRepository.find({
      where: { department, faculty, isActive: true },
    });
  }
}
