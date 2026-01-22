import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Application,
  Evaluation,
  Ranking,
  Staff,
  ProgramBaseScore,
  DepartmentRequirement,
  Quota,
} from '../../entities';
import { ApplicationStatus } from '../../common/enums';
import {
  convertGpaTo100Scale,
  isGradeAtLeast,
} from '../../common/utils/gpa-conversion.util';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplicationEventType, ApplicationEvent } from '../../common/events/application.events';

/**
 * ÖSYM Sıralama Limitleri (Yönerge MADDE 6)
 */
const OSYM_RANK_LIMITS = {
  ENGINEERING: 300000,
  ARCHITECTURE: 250000,
};

const FACULTY_TYPES = {
  ENGINEERING: 'Mühendislik Fakültesi',
  ARCHITECTURE: 'Mimarlık Fakültesi',
};

@Injectable()
export class YgkService {
  private readonly OSYM_WEIGHT = 0.9;
  private readonly GPA_WEIGHT = 0.1;
  private readonly MIN_GPA = 2.5;
  private readonly MIN_GPA_100 = 70;

  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(ProgramBaseScore)
    private programBaseScoreRepository: Repository<ProgramBaseScore>,
    @InjectRepository(DepartmentRequirement)
    private departmentRequirementRepository: Repository<DepartmentRequirement>,
    @InjectRepository(Quota)
    private quotaRepository: Repository<Quota>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * YGK değerlendirmesi bekleyen başvuruları getir
   * FACULTY_ROUTING: Fakülteye yönlendirilmiş (OIDB onayladı)
   * DEPARTMENT_ROUTING: Bölüme yönlendirilmiş, YGK değerlendirmesi bekliyor
   * YGK_EVALUATION: YGK değerlendirmesi devam ediyor
   *
   * NOT: Tamamlanmış değerlendirmesi olan başvurular hariç tutulur
   */
  async getPendingApplications(department?: string, faculty?: string) {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('application.documents', 'documents')
      .leftJoinAndSelect('application.evaluations', 'evaluations')
      .where('application.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.FACULTY_ROUTING,
          ApplicationStatus.DEPARTMENT_ROUTING,
          ApplicationStatus.YGK_EVALUATION,
        ],
      });

    if (department) {
      query.andWhere('application.targetDepartment = :department', { department });
    }

    if (faculty) {
      query.andWhere('application.targetFaculty = :faculty', { faculty });
    }

    // Tamamlanmış değerlendirmesi olan başvuruları getir ve filtrele
    const applications = await query.orderBy('application.createdAt', 'ASC').getMany();

    // Tamamlanmış değerlendirmesi olmayan başvuruları döndür
    return applications.filter(app => {
      const hasCompletedEvaluation = app.evaluations?.some(e => e.isCompleted);
      return !hasCompletedEvaluation;
    });
  }

  /**
   * Belirli bir başvuruyu getir
   */
  async getApplication(id: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: [
        'student',
        'student.user',
        'documents',
        'evaluations',
        'evaluations.evaluator',
        'evaluations.evaluator.user',
        'rankings',
      ],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Get department requirements
    const requirements = await this.departmentRequirementRepository.find({
      where: {
        department: application.targetDepartment,
        faculty: application.targetFaculty,
        isActive: true,
      },
    });

    // Get program base score
    const currentYear = new Date().getFullYear();
    const baseScore = await this.programBaseScoreRepository.findOne({
      where: {
        department: application.targetDepartment,
        faculty: application.targetFaculty,
        year: currentYear,
        isActive: true,
      },
    });

    return {
      application,
      departmentRequirements: requirements,
      programBaseScore: baseScore,
    };
  }

  /**
   * Değerlendirme oluştur veya getir
   * DEPARTMENT_ROUTING durumundaki başvuruyu YGK_EVALUATION'a geçirir
   */
  async createOrGetEvaluation(applicationId: string, userId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if application is ready for evaluation
    const validStatuses = [
      ApplicationStatus.DEPARTMENT_ROUTING,
      ApplicationStatus.YGK_EVALUATION,
    ];

    if (!validStatuses.includes(application.status)) {
      throw new BadRequestException(
        `Application is not ready for YGK evaluation. Current status: ${application.status}`,
      );
    }

    // If application is in DEPARTMENT_ROUTING, transition to YGK_EVALUATION
    if (application.status === ApplicationStatus.DEPARTMENT_ROUTING) {
      application.status = ApplicationStatus.YGK_EVALUATION;
      await this.applicationRepository.save(application);

      // Notify student
      if (application.student?.userId) {
        await this.notificationsService.notifyApplicationStatusChange(
          application.student.userId,
          application.applicationNumber,
          ApplicationStatus.YGK_EVALUATION,
        );
      }
    }

    const staff = await this.staffRepository.findOne({
      where: { userId },
    });

    if (!staff) {
      throw new NotFoundException('Staff record not found');
    }

    // Check for any existing evaluation for this application (regardless of evaluator)
    let evaluation = await this.evaluationRepository.findOne({
      where: { applicationId },
    });

    if (!evaluation) {
      // No evaluation exists, create a new one
      evaluation = this.evaluationRepository.create({
        applicationId,
        evaluatorId: staff.id,
        // Mock/demo için varsayılan İngilizce yeterliliği true
        isEnglishEligible: true,
      });
      await this.evaluationRepository.save(evaluation);
    }

    return evaluation;
  }

  /**
   * Yatay Geçiş Puanı Hesaplama (Yönerge MADDE 9-4)
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
   * ÖSYM Sıralama Kontrolü (Yönerge MADDE 6)
   */
  private checkOsymRankEligibility(
    osymRank: number,
    faculty: string,
  ): { isEligible: boolean; limit: number; message?: string } {
    let limit: number;

    if (faculty === FACULTY_TYPES.ARCHITECTURE) {
      limit = OSYM_RANK_LIMITS.ARCHITECTURE;
    } else {
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
          notes.push(`Manuel doğrulama gerekli: ${req.description}`);
          break;
      }
    }

    return { isMet: allMet, notes, requirements };
  }

  /**
   * Değerlendirme yap ve kaydet
   */
  async evaluate(
    evaluationId: string,
    userId: string,
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
      where: { id: evaluationId },
      relations: ['application', 'application.student'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    const application = evaluation.application;

    // Convert GPA to 100 scale
    const gpa100 = convertGpaTo100Scale(data.verifiedGpa);

    // Get program base score
    const programBaseScore = await this.programBaseScoreRepository.findOne({
      where: {
        department: application.targetDepartment,
        faculty: application.targetFaculty,
        year: data.verifiedOsymYear,
        isActive: true,
      },
    });

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

    // Check eligibility
    const isGpaEligible = data.verifiedGpa >= this.MIN_GPA && gpa100 >= this.MIN_GPA_100;
    const isOsymEligible = data.verifiedOsymScore > 0;
    const osymRankCheck = this.checkOsymRankEligibility(
      data.verifiedOsymRank,
      application.targetFaculty,
    );
    const isEnglishEligible = data.isEnglishEligible || data.isIyteEnglishExempt;

    const isOverallEligible =
      isGpaEligible &&
      isOsymEligible &&
      osymRankCheck.isEligible &&
      isEnglishEligible &&
      deptReqCheck.isMet;

    // Calculate transfer score
    const compositeScore = isOverallEligible
      ? this.calculateTransferScore(data.verifiedOsymScore, programBaseScore.baseScore, gpa100)
      : 0;

    // Update evaluation
    Object.assign(evaluation, {
      verifiedGpa: data.verifiedGpa,
      verifiedGpa100: gpa100,
      verifiedOsymScore: data.verifiedOsymScore,
      verifiedOsymRank: data.verifiedOsymRank,
      verifiedOsymYear: data.verifiedOsymYear,
      programBaseScore: programBaseScore.baseScore,
      compositeScore,
      isGpaEligible,
      isOsymEligible,
      isOsymRankEligible: osymRankCheck.isEligible,
      isEnglishEligible: data.isEnglishEligible,
      isIyteEnglishExempt: data.isIyteEnglishExempt,
      isDepartmentRequirementsMet: deptReqCheck.isMet,
      departmentRequirementsNotes: deptReqCheck.notes.join('; '),
      isOverallEligible,
      evaluationNotes: data.evaluationNotes || '',
      isCompleted: true,
      completedAt: new Date(),
    });

    // Build eligibility notes
    const notes: string[] = [];
    if (!isGpaEligible) {
      notes.push(`GPA (${data.verifiedGpa}/4.00 - ${gpa100}/100) minimum gereksinimi karşılamıyor`);
    }
    if (!isOsymEligible) {
      notes.push('ÖSYM puanı eksik veya geçersiz');
    }
    if (!osymRankCheck.isEligible) {
      notes.push(osymRankCheck.message!);
    }
    if (!isEnglishEligible) {
      notes.push('İngilizce yeterlilik şartı sağlanmadı');
    }
    if (!deptReqCheck.isMet) {
      notes.push(...deptReqCheck.notes);
    }
    evaluation.eligibilityNotes = notes.join('; ');

    await this.evaluationRepository.save(evaluation);

    // Update application status based on eligibility
    if (!isOverallEligible) {
      application.status = ApplicationStatus.REJECTED;
      application.rejectionReason = evaluation.eligibilityNotes;
      await this.applicationRepository.save(application);

      // Notify student
      if (application.student?.userId) {
        await this.notificationsService.notifyApplicationStatusChange(
          application.student.userId,
          application.applicationNumber,
          ApplicationStatus.REJECTED,
          evaluation.eligibilityNotes,
        );
      }
    }

    return evaluation;
  }

  /**
   * Mock değerlendirme oluştur (Development için)
   * Yeni başvurular için otomatik değerlendirme verisi oluşturur
   */
  private async generateMockEvaluationsForApplications(
    department: string,
    faculty: string,
    applicationPeriod: string,
  ) {
    // Get applications without completed evaluations
    const applications = await this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('application.evaluations', 'evaluations')
      .where('application.targetDepartment = :department', { department })
      .andWhere('application.targetFaculty = :faculty', { faculty })
      .andWhere('application.applicationPeriod = :applicationPeriod', { applicationPeriod })
      .andWhere('application.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.FACULTY_ROUTING,
          ApplicationStatus.DEPARTMENT_ROUTING,
          ApplicationStatus.YGK_EVALUATION,
        ],
      })
      .getMany();

    // Get default year (will be overridden per application if they have declaredOsymYear)
    const currentYear = new Date().getFullYear();

    // Get a staff member for evaluator (use first YGK member)
    const staff = await this.staffRepository.findOne({
      where: { department },
    });

    if (!staff) {
      console.warn(`No staff found for department ${department}`);
      return;
    }

    for (const application of applications) {
      // Check if already has a completed evaluation
      const hasCompletedEval = application.evaluations?.some(e => e.isCompleted);
      if (hasCompletedEval) continue;

      // Get ÖSYM year from application or use current year
      const osymYear = application.declaredOsymYear || currentYear;

      // Get program base score for the specific year
      const baseScore = await this.programBaseScoreRepository.findOne({
        where: {
          department,
          faculty,
          year: osymYear,
          isActive: true,
        },
      });

      if (!baseScore) {
        console.warn(`Program base score not found for ${department} ${osymYear}, skipping application ${application.applicationNumber}`);
        continue;
      }

      // Generate realistic values that ALWAYS meet eligibility criteria
      // GPA: Ensure it's always above minimum (2.5) - generate between 2.8 and 4.0
      const declaredGpa = application.declaredGpa || 3.0 + Math.random() * 0.8;
      const gpa = Math.min(4.0, Math.max(2.8, declaredGpa)); // Ensure >= 2.8 for safety margin
      const gpa100 = convertGpaTo100Scale(gpa);

      // ÖSYM score - use declared if available, generate good score otherwise
      const osymVariation = 0.95 + Math.random() * 0.10; // 95-105% of base score (better scores)
      const osymScore = application.declaredOsymScore || baseScore.baseScore * osymVariation;

      // ÖSYM rank - ensure within limits (max 200,000 for safe margin)
      const osymRank = application.declaredOsymRank || Math.floor(50000 + Math.random() * 150000); // 50k-200k range

      // Calculate composite score
      const compositeScore = this.calculateTransferScore(osymScore, baseScore.baseScore, gpa100);

      // These should always be true now due to the constrained generation above
      const isGpaEligible = gpa >= this.MIN_GPA && gpa100 >= this.MIN_GPA_100;
      const osymRankCheck = this.checkOsymRankEligibility(osymRank, faculty);
      const isOverallEligible = isGpaEligible && osymRankCheck.isEligible;

      // Create or update evaluation
      let evaluation = await this.evaluationRepository.findOne({
        where: { applicationId: application.id },
      });

      if (!evaluation) {
        evaluation = this.evaluationRepository.create({
          applicationId: application.id,
          evaluatorId: staff.id,
        });
      }

      Object.assign(evaluation, {
        verifiedGpa: gpa,
        verifiedGpa100: gpa100,
        verifiedOsymScore: osymScore,
        verifiedOsymRank: osymRank,
        verifiedOsymYear: osymYear,
        programBaseScore: baseScore.baseScore,
        compositeScore,
        isGpaEligible,
        isOsymEligible: true,
        isOsymRankEligible: osymRankCheck.isEligible,
        isEnglishEligible: true,
        isIyteEnglishExempt: false,
        isDepartmentRequirementsMet: true,
        isOverallEligible,
        evaluationNotes: 'Otomatik oluşturulan mock değerlendirme',
        isCompleted: true,
        completedAt: new Date(),
      });

      await this.evaluationRepository.save(evaluation);

      // Update application status
      application.status = ApplicationStatus.YGK_EVALUATION;
      await this.applicationRepository.save(application);

      console.log(`Mock evaluation created for ${application.applicationNumber}: Score ${compositeScore.toFixed(2)}`);
    }
  }

  /**
   * Sıralama oluştur (Yönerge MADDE 9)
   * Tüm başvuruları dahil eder (uygun olanlar ve olmayanlar)
   */
  async generateRankings(
    department: string,
    faculty: string,
    applicationPeriod: string,
  ) {
    // First, generate mock evaluations for applications without evaluations
    await this.generateMockEvaluationsForApplications(department, faculty, applicationPeriod);

    // Get quota for this department
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    const quota = await this.quotaRepository.findOne({
      where: {
        department,
        faculty,
        academicYear,
        isActive: true,
      },
    });

    if (!quota) {
      throw new BadRequestException(
        `${department} için ${academicYear} akademik yılı kontenjani bulunamadı`,
      );
    }

    // Get ALL evaluations (both eligible and ineligible)
    const allEvaluations = await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.application', 'application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('application.targetDepartment = :department', { department })
      .andWhere('application.targetFaculty = :faculty', { faculty })
      .andWhere('application.applicationPeriod = :applicationPeriod', { applicationPeriod })
      .andWhere('evaluation.isCompleted = :isCompleted', { isCompleted: true })
      .getMany();

    // Separate eligible and ineligible
    const eligibleEvaluations = allEvaluations
      .filter(e => e.isOverallEligible)
      .sort((a, b) => b.compositeScore - a.compositeScore);

    const ineligibleEvaluations = allEvaluations.filter(e => !e.isOverallEligible);

    // Clear existing rankings
    await this.rankingRepository.delete({
      department,
      faculty,
      applicationPeriod,
    });

    const rankings: Ranking[] = [];
    const notificationResults: Array<{
      userId: string;
      applicationNumber: string;
      department: string;
      result: {
        rank?: number;
        totalApplicants: number;
        quota: number;
        status: 'PRIMARY' | 'WAITLISTED' | 'NOT_ELIGIBLE';
        score?: number;
        reason?: string;
      };
    }> = [];

    const totalApplicants = allEvaluations.length;

    // Create rankings for eligible applicants
    for (let i = 0; i < eligibleEvaluations.length; i++) {
      const evaluation = eligibleEvaluations[i];
      const rank = i + 1;
      const isPrimary = rank <= quota.quota;
      const isWaitlisted = rank > quota.quota;

      const ranking = this.rankingRepository.create({
        applicationId: evaluation.applicationId,
        department,
        faculty,
        applicationPeriod,
        rank,
        score: evaluation.compositeScore,
        isPrimary,
        isWaitlisted,
        quota: quota.quota,
      });

      rankings.push(ranking);

      // Update application status
      const newStatus = isPrimary
        ? ApplicationStatus.RANKED
        : ApplicationStatus.WAITLISTED;

      await this.applicationRepository.update(evaluation.applicationId, {
        status: newStatus,
      });

      // Prepare notification for student
      const student = evaluation.application?.student;
      if (student?.userId) {
        notificationResults.push({
          userId: student.userId,
          applicationNumber: evaluation.application.applicationNumber,
          department,
          result: {
            rank,
            totalApplicants,
            quota: quota.quota,
            status: isPrimary ? 'PRIMARY' : 'WAITLISTED',
            score: evaluation.compositeScore,
          },
        });
      }
    }

    // Handle ineligible applicants (include in ranking list but mark as not eligible)
    for (const evaluation of ineligibleEvaluations) {
      // Create ranking record with rank = 0 (not ranked)
      const ranking = this.rankingRepository.create({
        applicationId: evaluation.applicationId,
        department,
        faculty,
        applicationPeriod,
        rank: 0, // Not ranked
        score: 0,
        isPrimary: false,
        isWaitlisted: false,
        quota: quota.quota,
      });

      rankings.push(ranking);

      // Update application status to REJECTED
      await this.applicationRepository.update(evaluation.applicationId, {
        status: ApplicationStatus.REJECTED,
        rejectionReason: evaluation.eligibilityNotes || 'Uygunluk kriterleri karşılanmadı',
      });

      // Prepare notification for student
      const student = evaluation.application?.student;
      if (student?.userId) {
        notificationResults.push({
          userId: student.userId,
          applicationNumber: evaluation.application.applicationNumber,
          department,
          result: {
            totalApplicants,
            quota: quota.quota,
            status: 'NOT_ELIGIBLE',
            reason: evaluation.eligibilityNotes,
          },
        });
      }
    }

    // Save all rankings
    await this.rankingRepository.save(rankings);

    // Send all notifications
    await this.notificationsService.notifyRankingResultsBulk(notificationResults);

    return {
      message: `${allEvaluations.length} başvuru değerlendirildi, ${eligibleEvaluations.length} başvuru sıralandı`,
      quota: quota.quota,
      totalApplicants,
      primary: rankings.filter((r) => r.isPrimary).length,
      waitlisted: rankings.filter((r) => r.isWaitlisted).length,
      notEligible: ineligibleEvaluations.length,
      rankings,
    };
  }

  /**
   * Sıralamaları getir
   */
  async getRankings(department: string, applicationPeriod: string) {
    return this.rankingRepository.find({
      where: { department, applicationPeriod },
      relations: ['application', 'application.student', 'application.student.user'],
      order: { rank: 'ASC' },
    });
  }

  /**
   * Sıralamaları Fakülte Kuruluna gönder
   */
  async sendRankingsToFacultyBoard(department: string, applicationPeriod: string) {
    const rankings = await this.rankingRepository.find({
      where: { department, applicationPeriod },
      relations: ['application'],
    });

    if (rankings.length === 0) {
      throw new BadRequestException('No rankings found for this department/period');
    }

    // Update application statuses to FACULTY_BOARD
    const applicationIds = rankings.map((r) => r.applicationId);
    await this.applicationRepository.update(
      { id: In(applicationIds) },
      { status: ApplicationStatus.FACULTY_BOARD },
    );

    return {
      message: `${rankings.length} başvuru Fakülte Kuruluna gönderildi`,
      count: rankings.length,
    };
  }

  /**
   * YGK istatistikleri
   */
  async getStatistics(department?: string, faculty?: string) {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .select('application.status', 'status')
      .addSelect('COUNT(*)', 'count');

    if (department) {
      query.where('application.targetDepartment = :department', { department });
    }

    if (faculty) {
      query.andWhere('application.targetFaculty = :faculty', { faculty });
    }

    const statusCounts = await query
      .groupBy('application.status')
      .getRawMany();

    const pendingCount = await this.applicationRepository.count({
      where: { status: ApplicationStatus.YGK_EVALUATION },
    });

    const completedEvaluations = await this.evaluationRepository.count({
      where: { isCompleted: true },
    });

    return {
      pendingEvaluations: pendingCount,
      completedEvaluations,
      byStatus: statusCounts,
    };
  }

  /**
   * Değerlendirme bekleyen bölümleri listele
   */
  async getPendingDepartments() {
    const departments = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.targetDepartment', 'department')
      .addSelect('application.targetFaculty', 'faculty')
      .addSelect('COUNT(*)', 'count')
      .where('application.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.FACULTY_ROUTING,
          ApplicationStatus.DEPARTMENT_ROUTING,
          ApplicationStatus.YGK_EVALUATION,
        ],
      })
      .groupBy('application.targetDepartment')
      .addGroupBy('application.targetFaculty')
      .getRawMany();

    return departments;
  }

  // Event listener'lar devre dışı bırakıldı - YGK manuel değerlendirme yapacak
  // Mock değerlendirmeler sadece seed:mock-apps ile oluşturulur

  // @OnEvent(ApplicationEventType.ROUTED_TO_DEPARTMENT)
  // async handleApplicationRoutedToDepartment(payload: Record<string, any>) {
  //   const event = payload as ApplicationEvent;
  //   console.log(`[YGK Event] Application routed to department: ${event.applicationNumber}`);
  //   await this.generateMockEvaluationForSingleApplication(
  //     event.applicationId,
  //     event.targetDepartment,
  //     event.targetFaculty,
  //   );
  // }

  // @OnEvent(ApplicationEventType.ROUTED_TO_FACULTY)
  // async handleApplicationRoutedToFaculty(payload: Record<string, any>) {
  //   const event = payload as ApplicationEvent;
  //   console.log(`[YGK Event] Application routed to faculty: ${event.applicationNumber}`);
  //   await this.generateMockEvaluationForSingleApplication(
  //     event.applicationId,
  //     event.targetDepartment,
  //     event.targetFaculty,
  //   );
  // }

  /**
   * Tek bir başvuru için mock değerlendirme oluştur
   */
  private async generateMockEvaluationForSingleApplication(
    applicationId: string,
    department: string,
    faculty: string,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['student', 'evaluations'],
    });

    if (!application) {
      console.warn(`[YGK Event] Application not found: ${applicationId}`);
      return;
    }

    // Check if already has a completed evaluation
    const hasCompletedEval = application.evaluations?.some(e => e.isCompleted);
    if (hasCompletedEval) {
      console.log(`[YGK Event] Application ${application.applicationNumber} already has evaluation, skipping`);
      return;
    }

    // Get a staff member for evaluator
    const staff = await this.staffRepository.findOne({
      where: { department },
    });

    if (!staff) {
      console.warn(`[YGK Event] No staff found for department ${department}`);
      return;
    }

    // Get ÖSYM year from application or use current year
    const currentYear = new Date().getFullYear();
    const osymYear = application.declaredOsymYear || currentYear;

    // Get program base score for the specific year
    const baseScore = await this.programBaseScoreRepository.findOne({
      where: {
        department,
        faculty,
        year: osymYear,
        isActive: true,
      },
    });

    if (!baseScore) {
      console.warn(`[YGK Event] Program base score not found for ${department} ${osymYear}`);
      return;
    }

    // Generate realistic values that ALWAYS meet eligibility criteria
    // GPA: Ensure it's always above minimum (2.5) - generate between 2.8 and 4.0
    const declaredGpa = application.declaredGpa || 3.0 + Math.random() * 0.8;
    const gpa = Math.min(4.0, Math.max(2.8, declaredGpa)); // Ensure >= 2.8 for safety margin
    const gpa100 = convertGpaTo100Scale(gpa);

    // ÖSYM score - use declared if available, generate good score otherwise
    const osymVariation = 0.95 + Math.random() * 0.10; // 95-105% of base score (better scores)
    const osymScore = application.declaredOsymScore || baseScore.baseScore * osymVariation;

    // ÖSYM rank - ensure within limits (max 200,000 for safe margin)
    const maxSafeRank = 200000; // Well under both 250k and 300k limits
    const osymRank = application.declaredOsymRank || Math.floor(50000 + Math.random() * 150000); // 50k-200k range

    // Calculate composite score
    const compositeScore = this.calculateTransferScore(osymScore, baseScore.baseScore, gpa100);

    // These should always be true now due to the constrained generation above
    const isGpaEligible = gpa >= this.MIN_GPA && gpa100 >= this.MIN_GPA_100;
    const osymRankCheck = this.checkOsymRankEligibility(osymRank, faculty);
    const isOverallEligible = isGpaEligible && osymRankCheck.isEligible;

    // Create or update evaluation
    let evaluation = await this.evaluationRepository.findOne({
      where: { applicationId: application.id },
    });

    if (!evaluation) {
      evaluation = this.evaluationRepository.create({
        applicationId: application.id,
        evaluatorId: staff.id,
      });
    }

    Object.assign(evaluation, {
      verifiedGpa: gpa,
      verifiedGpa100: gpa100,
      verifiedOsymScore: osymScore,
      verifiedOsymRank: osymRank,
      verifiedOsymYear: osymYear,
      programBaseScore: baseScore.baseScore,
      compositeScore,
      isGpaEligible,
      isOsymEligible: true,
      isOsymRankEligible: osymRankCheck.isEligible,
      isEnglishEligible: true,
      isIyteEnglishExempt: false,
      isDepartmentRequirementsMet: true,
      isOverallEligible,
      evaluationNotes: 'Otomatik oluşturulan mock değerlendirme (event-driven)',
      isCompleted: true,
      completedAt: new Date(),
    });

    await this.evaluationRepository.save(evaluation);

    console.log(`[YGK Event] Mock evaluation created for ${application.applicationNumber}: Score ${compositeScore.toFixed(2)}`);
  }
}
