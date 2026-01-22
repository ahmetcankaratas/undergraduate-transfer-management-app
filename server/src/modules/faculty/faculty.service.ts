import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Application,
  Staff,
  FacultyBoardDecision,
  Ranking,
  Quota,
} from '../../entities';
import {
  FacultyBoardDecisionType,
} from '../../entities/faculty-board-decision.entity';
import { ApplicationStatus } from '../../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplicationEventType, ApplicationEvent } from '../../common/events/application.events';

@Injectable()
export class FacultyService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(FacultyBoardDecision)
    private boardDecisionRepository: Repository<FacultyBoardDecision>,
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    @InjectRepository(Quota)
    private quotaRepository: Repository<Quota>,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Emit application event for workflow automation
   */
  private emitEvent(
    type: ApplicationEventType,
    application: Application,
    data?: Record<string, any>,
  ) {
    const event: ApplicationEvent = {
      type,
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      studentId: application.studentId,
      userId: application.student?.userId,
      targetFaculty: application.targetFaculty,
      targetDepartment: application.targetDepartment,
      timestamp: new Date(),
      data,
    };
    this.eventEmitter.emit(type, event);
  }

  /**
   * Fakülteye yönlendirilmiş başvuruları listele
   */
  async getApplicationsForFaculty(faculty: string, status?: ApplicationStatus) {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('application.documents', 'documents')
      .leftJoinAndSelect('application.evaluations', 'evaluations')
      .leftJoinAndSelect('application.rankings', 'rankings')
      .where('application.targetFaculty = :faculty', { faculty });

    if (status) {
      query.andWhere('application.status = :status', { status });
    } else {
      // Default: FACULTY_ROUTING veya sonrası
      query.andWhere('application.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.FACULTY_ROUTING,
          ApplicationStatus.DEPARTMENT_ROUTING,
          ApplicationStatus.YGK_EVALUATION,
          ApplicationStatus.RANKED,
          ApplicationStatus.WAITLISTED,
          ApplicationStatus.FACULTY_BOARD,
        ],
      });
    }

    return query.orderBy('application.createdAt', 'DESC').getMany();
  }

  /**
   * Bölüme yönlendirilmeyi bekleyen başvuruları listele
   */
  async getPendingDepartmentRouting(faculty: string) {
    return this.applicationRepository.find({
      where: {
        targetFaculty: faculty,
        status: ApplicationStatus.FACULTY_ROUTING,
      },
      relations: ['student', 'student.user', 'documents'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Fakülte ön incelemesinde başvuruyu reddet
   * Yönerge'ye göre uygun olmayan başvurular bu aşamada elenebilir
   */
  async rejectApplicationAtFacultyReview(
    applicationId: string,
    staffId: string,
    reason: string,
    notes?: string,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, status: ApplicationStatus.FACULTY_ROUTING },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException(
        'Application not found or not in FACULTY_ROUTING status',
      );
    }

    application.status = ApplicationStatus.REJECTED;
    application.rejectionReason = reason;
    if (notes) {
      application.notes = notes;
    }

    await this.applicationRepository.save(application);

    // Notify student
    if (application.student?.userId) {
      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        ApplicationStatus.REJECTED,
        reason,
      );
    }

    return {
      message: 'Application rejected',
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
    };
  }

  /**
   * Başvuruları bölüme toplu yönlendir
   */
  async routeApplicationsToDepartment(
    applicationIds: string[],
    staffId: string,
  ) {
    const applications = await this.applicationRepository.find({
      where: {
        id: In(applicationIds),
        status: ApplicationStatus.FACULTY_ROUTING,
      },
      relations: ['student'],
    });

    if (applications.length === 0) {
      throw new BadRequestException('No valid applications found for routing');
    }

    const results: Array<{ applicationId: string; applicationNumber: string; status: string }> = [];
    for (const application of applications) {
      application.status = ApplicationStatus.DEPARTMENT_ROUTING;
      application.routedToDepartmentAt = new Date();

      await this.applicationRepository.save(application);

      // Notify student
      if (application.student?.userId) {
        await this.notificationsService.notifyApplicationStatusChange(
          application.student.userId,
          application.applicationNumber,
          ApplicationStatus.DEPARTMENT_ROUTING,
          application.targetDepartment,
        );
      }

      // Emit event for workflow automation (triggers mock evaluation generation)
      this.emitEvent(ApplicationEventType.ROUTED_TO_DEPARTMENT, application);

      results.push({
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        status: 'routed',
      });
    }

    return {
      message: `${results.length} applications routed to departments`,
      results,
    };
  }

  /**
   * Fakülte Kurulu kararı bekleyen başvuruları listele
   */
  async getPendingBoardDecisions(faculty: string) {
    return this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('application.rankings', 'rankings')
      .leftJoinAndSelect('application.evaluations', 'evaluations')
      .where('application.targetFaculty = :faculty', { faculty })
      .andWhere('application.status IN (:...statuses)', {
        statuses: [ApplicationStatus.RANKED, ApplicationStatus.WAITLISTED],
      })
      .andWhere('application.facultyBoardDecision IS NULL')
      .orderBy('rankings.rank', 'ASC')
      .getMany();
  }

  /**
   * Fakülte Kurulu kararı oluştur
   */
  async createBoardDecision(
    applicationId: string,
    staffId: string,
    data: {
      decision: FacultyBoardDecisionType;
      meetingDate?: Date;
      meetingNumber?: string;
      decisionNumber?: string;
      notes?: string;
      conditions?: string;
    },
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const staff = await this.staffRepository.findOne({
      where: { userId: staffId },
    });

    // Check if decision already exists
    let boardDecision = await this.boardDecisionRepository.findOne({
      where: { applicationId },
    });

    if (boardDecision) {
      // Update existing
      Object.assign(boardDecision, data);
      boardDecision.decidedBy = staff?.id;
      boardDecision.decidedAt = new Date();
    } else {
      // Create new
      boardDecision = this.boardDecisionRepository.create({
        applicationId,
        ...data,
        decidedBy: staff?.id,
        decidedAt: new Date(),
      });
    }

    await this.boardDecisionRepository.save(boardDecision);

    // Update application
    application.facultyBoardDecision = data.decision;
    application.facultyBoardDecisionAt = new Date();

    if (data.decision === FacultyBoardDecisionType.APPROVED) {
      application.status = ApplicationStatus.APPROVED;
    } else if (data.decision === FacultyBoardDecisionType.REJECTED) {
      application.status = ApplicationStatus.REJECTED;
      application.rejectionReason = data.notes || 'Fakülte Kurulu tarafından reddedildi';
    } else if (data.decision === FacultyBoardDecisionType.CONDITIONAL) {
      application.status = ApplicationStatus.APPROVED;
      application.notes = `Şartlı kabul: ${data.conditions}`;
    }

    await this.applicationRepository.save(application);

    // Notify student
    if (application.student?.userId) {
      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        application.status,
        data.notes,
      );
    }

    return boardDecision;
  }

  /**
   * Toplu Fakülte Kurulu kararı oluştur
   */
  async createBulkBoardDecisions(
    staffId: string,
    decisions: Array<{
      applicationId: string;
      decision: FacultyBoardDecisionType;
      notes?: string;
      conditions?: string;
    }>,
    meetingInfo: {
      meetingDate: Date;
      meetingNumber: string;
    },
  ) {
    const results: Array<{
      applicationId: string;
      status: string;
      decision?: FacultyBoardDecision;
      error?: string;
    }> = [];

    for (const decisionData of decisions) {
      try {
        const result = await this.createBoardDecision(
          decisionData.applicationId,
          staffId,
          {
            decision: decisionData.decision,
            meetingDate: meetingInfo.meetingDate,
            meetingNumber: meetingInfo.meetingNumber,
            notes: decisionData.notes,
            conditions: decisionData.conditions,
          },
        );
        results.push({
          applicationId: decisionData.applicationId,
          status: 'success',
          decision: result,
        });
      } catch (error: any) {
        results.push({
          applicationId: decisionData.applicationId,
          status: 'error',
          error: error.message,
        });
      }
    }

    return {
      message: `Processed ${results.length} board decisions`,
      meetingInfo,
      results,
    };
  }

  /**
   * Fakülte Kurulu kararlarını ÖİDB'ye gönder
   */
  async sendDecisionsToOidb(faculty: string, applicationPeriod: string) {
    const decisions = await this.boardDecisionRepository
      .createQueryBuilder('decision')
      .leftJoinAndSelect('decision.application', 'application')
      .where('application.targetFaculty = :faculty', { faculty })
      .andWhere('application.applicationPeriod = :applicationPeriod', {
        applicationPeriod,
      })
      .andWhere('decision.isSentToOidb = :isSent', { isSent: false })
      .andWhere('decision.decision != :pending', {
        pending: FacultyBoardDecisionType.PENDING,
      })
      .getMany();

    if (decisions.length === 0) {
      return { message: 'No pending decisions to send', count: 0 };
    }

    for (const decision of decisions) {
      decision.isSentToOidb = true;
      decision.sentToOidbAt = new Date();
    }

    await this.boardDecisionRepository.save(decisions);

    // TODO: Notify OIDB staff about new decisions
    // This would trigger notifications to OIDB staff members

    return {
      message: `${decisions.length} decisions sent to OIDB`,
      count: decisions.length,
      sentAt: new Date(),
    };
  }

  /**
   * Fakülte Kurulu karar özetini getir
   */
  async getBoardDecisionSummary(faculty: string, applicationPeriod: string) {
    const decisions = await this.boardDecisionRepository
      .createQueryBuilder('decision')
      .leftJoinAndSelect('decision.application', 'application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('application.targetFaculty = :faculty', { faculty })
      .andWhere('application.applicationPeriod = :applicationPeriod', {
        applicationPeriod,
      })
      .getMany();

    const summary = {
      total: decisions.length,
      approved: decisions.filter(
        (d) => d.decision === FacultyBoardDecisionType.APPROVED,
      ).length,
      rejected: decisions.filter(
        (d) => d.decision === FacultyBoardDecisionType.REJECTED,
      ).length,
      conditional: decisions.filter(
        (d) => d.decision === FacultyBoardDecisionType.CONDITIONAL,
      ).length,
      pending: decisions.filter(
        (d) => d.decision === FacultyBoardDecisionType.PENDING,
      ).length,
      sentToOidb: decisions.filter((d) => d.isSentToOidb).length,
    };

    return {
      summary,
      decisions,
    };
  }

  /**
   * Bölüm bazında başvuru istatistikleri
   */
  async getDepartmentStatistics(faculty: string, applicationPeriod?: string) {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .select('application.targetDepartment', 'department')
      .addSelect('application.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('application.targetFaculty = :faculty', { faculty });

    if (applicationPeriod) {
      query.andWhere('application.applicationPeriod = :applicationPeriod', {
        applicationPeriod,
      });
    }

    const results = await query
      .groupBy('application.targetDepartment')
      .addGroupBy('application.status')
      .getRawMany();

    // Group by department
    const departmentStats: Record<string, any> = {};
    for (const row of results) {
      if (!departmentStats[row.department]) {
        departmentStats[row.department] = {
          department: row.department,
          total: 0,
          byStatus: {},
        };
      }
      departmentStats[row.department].byStatus[row.status] = parseInt(row.count);
      departmentStats[row.department].total += parseInt(row.count);
    }

    return Object.values(departmentStats);
  }

  /**
   * Kontenjan bilgisi getir
   */
  async getQuotas(faculty: string, academicYear: string) {
    return this.quotaRepository.find({
      where: { faculty, academicYear, isActive: true },
      order: { department: 'ASC', semester: 'ASC' },
    });
  }

  /**
   * Kontenjan güncelle
   */
  async updateQuota(
    id: string,
    data: { quota?: number; filledCount?: number },
  ) {
    const quota = await this.quotaRepository.findOne({ where: { id } });
    if (!quota) {
      throw new NotFoundException('Quota not found');
    }

    Object.assign(quota, data);
    return this.quotaRepository.save(quota);
  }

  /**
   * Kontenjan oluştur
   */
  async createQuota(data: {
    department: string;
    faculty: string;
    semester: number;
    academicYear: string;
    quota: number;
  }) {
    const existing = await this.quotaRepository.findOne({
      where: {
        department: data.department,
        faculty: data.faculty,
        semester: data.semester,
        academicYear: data.academicYear,
      },
    });

    if (existing) {
      existing.quota = data.quota;
      return this.quotaRepository.save(existing);
    }

    const quota = this.quotaRepository.create(data);
    return this.quotaRepository.save(quota);
  }
}
