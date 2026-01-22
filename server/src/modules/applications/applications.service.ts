import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Application, Student } from '../../entities';
import { ApplicationStatus, UserRole } from '../../common/enums';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  FilterApplicationDto,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApplicationEventType,
  ApplicationEvent,
  DEFAULT_WORKFLOW_CONFIG,
} from '../../common/events/application.events';

@Injectable()
export class ApplicationsService {
  private workflowConfig = DEFAULT_WORKFLOW_CONFIG;

  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
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

  private generateApplicationNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `UTMS-${year}-${random}`;
  }

  private getCurrentApplicationPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed
    // Güz dönemi: Ağustos-Ocak, Bahar dönemi: Şubat-Temmuz
    const semester = month >= 8 || month <= 1 ? 'Güz' : 'Bahar';
    const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    return `${academicYear}-${semester}`;
  }

  async create(userId: string, createDto: CreateApplicationDto) {
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const application = this.applicationRepository.create({
      ...createDto,
      studentId: student.id,
      applicationNumber: this.generateApplicationNumber(),
      applicationPeriod: createDto.applicationPeriod || this.getCurrentApplicationPeriod(),
      status: ApplicationStatus.DRAFT,
    });

    return this.applicationRepository.save(application);
  }

  async findAll(filters: FilterApplicationDto, user: any) {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('application.documents', 'documents')
      .leftJoinAndSelect('application.rankings', 'rankings');

    // Role-based filtering
    if (user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { userId: user.id },
      });
      if (student) {
        query.andWhere('application.studentId = :studentId', {
          studentId: student.id,
        });
      }
    } else if (user.role === UserRole.FACULTY_STAFF && user.staff?.faculty) {
      query.andWhere('application.targetFaculty = :faculty', {
        faculty: user.staff.faculty,
      });
    } else if (user.role === UserRole.YGK_MEMBER && user.staff?.department) {
      query.andWhere('application.targetDepartment = :department', {
        department: user.staff.department,
      });
    }

    // Apply filters
    if (filters.status) {
      query.andWhere('application.status = :status', { status: filters.status });
    }

    if (filters.targetFaculty) {
      query.andWhere('application.targetFaculty = :targetFaculty', {
        targetFaculty: filters.targetFaculty,
      });
    }

    if (filters.targetDepartment) {
      query.andWhere('application.targetDepartment = :targetDepartment', {
        targetDepartment: filters.targetDepartment,
      });
    }

    if (filters.applicationPeriod) {
      query.andWhere('application.applicationPeriod = :applicationPeriod', {
        applicationPeriod: filters.applicationPeriod,
      });
    }

    if (filters.searchTerm) {
      query.andWhere(
        '(application.applicationNumber LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${filters.searchTerm}%` },
      );
    }

    query.orderBy('application.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, user: any) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['student', 'student.user', 'documents', 'evaluations', 'rankings'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check access
    if (user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { userId: user.id },
      });
      if (application.studentId !== student?.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return application;
  }

  async update(id: string, updateDto: UpdateApplicationDto, user: any) {
    const application = await this.findOne(id, user);

    // Only allow updates if application is in DRAFT status for students
    if (
      user.role === UserRole.STUDENT &&
      application.status !== ApplicationStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Cannot update application after submission',
      );
    }

    Object.assign(application, updateDto);
    return this.applicationRepository.save(application);
  }

  async submit(id: string, user: any) {
    const application = await this.findOne(id, user);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Application already submitted');
    }

    application.status = ApplicationStatus.SUBMITTED;
    application.submittedAt = new Date();

    const savedApplication = await this.applicationRepository.save(application);

    // Send notification to student
    await this.notificationsService.notifyApplicationSubmitted(
      user.id,
      application.applicationNumber,
    );

    return savedApplication;
  }

  async review(id: string, reviewerId: string, approved: boolean, notes?: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException('Application is not in submitted status');
    }

    // When approved, route to faculty (FACULTY_ROUTING)
    // When rejected, set status to REJECTED
    const newStatus = approved
      ? ApplicationStatus.FACULTY_ROUTING
      : ApplicationStatus.REJECTED;

    application.status = newStatus;
    application.reviewedAt = new Date();
    application.reviewedBy = reviewerId;

    if (approved) {
      application.routedToFacultyAt = new Date();
    } else {
      application.rejectionReason = notes || 'ÖİDB tarafından reddedildi';
    }

    const savedApplication = await this.applicationRepository.save(application);

    // Emit event for workflow automation
    if (approved) {
      this.emitEvent(ApplicationEventType.OIDB_APPROVED, savedApplication, { reviewerId });
      this.emitEvent(ApplicationEventType.ROUTED_TO_FACULTY, savedApplication);
    } else {
      this.emitEvent(ApplicationEventType.OIDB_REJECTED, savedApplication, { reason: notes });
    }

    // Send notification to student
    if (application.student?.userId) {
      const details = approved ? application.targetFaculty : notes;

      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        newStatus,
        details,
      );
    }

    return savedApplication;
  }

  async routeToFaculty(id: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.OIDB_REVIEW) {
      throw new BadRequestException('Application is not ready for routing');
    }

    application.status = ApplicationStatus.FACULTY_ROUTING;
    application.routedToFacultyAt = new Date();

    const savedApplication = await this.applicationRepository.save(application);

    // Send notification to student
    if (application.student?.userId) {
      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        ApplicationStatus.FACULTY_ROUTING,
      );
    }

    return savedApplication;
  }

  async routeToDepartment(id: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.FACULTY_ROUTING) {
      throw new BadRequestException(
        'Application is not ready for department routing',
      );
    }

    application.status = ApplicationStatus.DEPARTMENT_ROUTING;
    application.routedToDepartmentAt = new Date();

    const savedApplication = await this.applicationRepository.save(application);

    // Send notification to student
    if (application.student?.userId) {
      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        ApplicationStatus.DEPARTMENT_ROUTING,
      );
    }

    // Emit event for workflow automation (triggers mock evaluation generation)
    this.emitEvent(ApplicationEventType.ROUTED_TO_DEPARTMENT, savedApplication);

    return savedApplication;
  }

  async setForEvaluation(id: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = ApplicationStatus.YGK_EVALUATION;
    const savedApplication = await this.applicationRepository.save(application);

    // Send notification to student
    if (application.student?.userId) {
      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        ApplicationStatus.YGK_EVALUATION,
      );
    }

    return savedApplication;
  }

  async setFacultyBoardDecision(
    id: string,
    decision: string,
    notes?: string,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.facultyBoardDecision = decision;
    application.facultyBoardDecisionAt = new Date();

    let newStatus = application.status;
    if (decision === 'APPROVED') {
      application.status = ApplicationStatus.APPROVED;
      newStatus = ApplicationStatus.APPROVED;
    } else if (decision === 'REJECTED') {
      application.status = ApplicationStatus.REJECTED;
      newStatus = ApplicationStatus.REJECTED;
      if (notes) {
        application.rejectionReason = notes;
      }
    }

    const savedApplication = await this.applicationRepository.save(application);

    // Send notification to student
    if (application.student?.userId) {
      await this.notificationsService.notifyApplicationStatusChange(
        application.student.userId,
        application.applicationNumber,
        newStatus,
      );
    }

    return savedApplication;
  }

  async delete(id: string, user: any) {
    const application = await this.findOne(id, user);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot delete application after submission',
      );
    }

    await this.applicationRepository.remove(application);
    return { message: 'Application deleted successfully' };
  }

  async getStatistics() {
    const total = await this.applicationRepository.count();
    const byStatus = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('application.status')
      .getRawMany();

    const byFaculty = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.targetFaculty', 'faculty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('application.targetFaculty')
      .getRawMany();

    return { total, byStatus, byFaculty };
  }
}
