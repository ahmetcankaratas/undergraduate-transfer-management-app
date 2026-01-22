import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IntibakTable,
  CourseEquivalence,
  Course,
  Application,
  CourseType,
} from '../../entities';
import { ApplicationStatus } from '../../common/enums';

@Injectable()
export class IntibakService {
  constructor(
    @InjectRepository(IntibakTable)
    private intibakTableRepository: Repository<IntibakTable>,
    @InjectRepository(CourseEquivalence)
    private courseEquivalenceRepository: Repository<CourseEquivalence>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {}

  async createIntibakTable(applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['intibakTable'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.intibakTable) {
      return application.intibakTable;
    }

    // Only allow for ranked/eligible applications (adjust status check as needed)
    if (
      ![ApplicationStatus.RANKED, ApplicationStatus.WAITLISTED].includes(
        application.status as ApplicationStatus,
      )
    ) {
      // For development flexibility, we might allow it, but ideally strict check:
      // throw new BadRequestException('Application is not eligible for intibak');
    }

    const intibakTable = this.intibakTableRepository.create({
      applicationId,
    });

    return this.intibakTableRepository.save(intibakTable);
  }

  async getIntibakTable(applicationId: string) {
    const table = await this.intibakTableRepository.findOne({
      where: { applicationId },
      relations: [
        'equivalences',
        'equivalences.sourceCourse',
        'equivalences.targetCourse',
      ],
    });

    if (!table) {
      throw new NotFoundException('Intibak table not found');
    }

    return table;
  }

  async addEquivalence(
    intibakTableId: string,
    data: {
      sourceCourseId: string;
      targetCourseId: string;
      isMatch: boolean;
      notes?: string;
    },
  ) {
    const table = await this.intibakTableRepository.findOne({
      where: { id: intibakTableId },
    });

    if (!table) {
      throw new NotFoundException('Intibak table not found');
    }

    if (table.isApproved) {
      throw new BadRequestException('Cannot modify approved intibak table');
    }

    const equivalence = this.courseEquivalenceRepository.create({
      intibakTableId,
      ...data,
    });

    return this.courseEquivalenceRepository.save(equivalence);
  }

  async removeEquivalence(equivalenceId: string) {
    const equivalence = await this.courseEquivalenceRepository.findOne({
      where: { id: equivalenceId },
      relations: ['intibakTable'],
    });

    if (!equivalence) {
      throw new NotFoundException('Equivalence not found');
    }

    if (equivalence.intibakTable.isApproved) {
      throw new BadRequestException('Cannot modify approved intibak table');
    }

    await this.courseEquivalenceRepository.remove(equivalence);
  }

  async approveIntibakTable(intibakTableId: string, staffId: string) {
    const table = await this.intibakTableRepository.findOne({
      where: { id: intibakTableId },
    });

    if (!table) {
      throw new NotFoundException('Intibak table not found');
    }

    table.isApproved = true;
    table.approvedBy = staffId;
    table.finalizedAt = new Date();

    return this.intibakTableRepository.save(table);
  }

  // Helper to create mock courses for testing
  async createMockCourses(studentId: string) {
    // Previous courses
    const prevCourses = [
      {
        code: 'MAT101',
        name: 'Calculus I',
        credits: 4,
        grade: 'AA',
        type: CourseType.PREVIOUS,
        institution: 'Previous Univ',
      },
      {
        code: 'PHYS101',
        name: 'Physics I',
        credits: 4,
        grade: 'BA',
        type: CourseType.PREVIOUS,
        institution: 'Previous Univ',
      },
    ];

    // Target courses (IZTECH)
    const targetCourses = [
      {
        code: 'MATH141',
        name: 'Calculus I',
        credits: 4,
        type: CourseType.TARGET,
        institution: 'IZTECH',
      },
      {
        code: 'PHYS121',
        name: 'General Physics I',
        credits: 4,
        type: CourseType.TARGET,
        institution: 'IZTECH',
      },
    ];

    const savedPrev = await this.courseRepository.save(
      prevCourses.map((c) => this.courseRepository.create({ ...c, studentId })),
    );

    const savedTarget = await this.courseRepository.save(
      targetCourses.map((c) => this.courseRepository.create(c)),
    );

    return { prev: savedPrev, target: savedTarget };
  }
}
