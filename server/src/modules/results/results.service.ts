import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ranking, Application } from '../../entities';

export interface PublicResultItem {
  rank: number;
  isPrimary: boolean;
  isWaitlisted: boolean;
  score: number;
  applicationNumber: string;
  // Masked student info for privacy
  maskedName?: string;
}

export interface PublicResults {
  department: string;
  faculty: string;
  applicationPeriod: string;
  publishedAt: Date;
  quota: number;
  primaryCandidates: PublicResultItem[];
  waitlistedCandidates: PublicResultItem[];
  totalApplicants: number;
}

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {}

  /**
   * Mask name for privacy (e.g., "Ahmet Karataş" -> "A**** K******")
   */
  private maskName(firstName: string, lastName: string): string {
    const maskString = (str: string) => {
      if (!str || str.length === 0) return '*';
      return str[0] + '*'.repeat(Math.max(str.length - 1, 3));
    };
    return `${maskString(firstName)} ${maskString(lastName)}`;
  }

  /**
   * Get published results for a department (public access)
   * Yönerge MADDE 10: Sonuçlar ÖİDB internet sayfasında yayınlanır
   */
  async getPublicResults(
    department: string,
    applicationPeriod: string,
  ): Promise<PublicResults | null> {
    const rankings = await this.rankingRepository.find({
      where: {
        department,
        applicationPeriod,
        isPublished: true,
      },
      relations: ['application', 'application.student', 'application.student.user'],
      order: { rank: 'ASC' },
    });

    if (rankings.length === 0) {
      return null;
    }

    const firstRanking = rankings[0];
    const primaryCandidates: PublicResultItem[] = [];
    const waitlistedCandidates: PublicResultItem[] = [];

    for (const ranking of rankings) {
      const user = ranking.application?.student?.user;
      const item: PublicResultItem = {
        rank: ranking.rank,
        isPrimary: ranking.isPrimary,
        isWaitlisted: ranking.isWaitlisted,
        score: Number(ranking.score.toFixed(4)),
        applicationNumber: ranking.application?.applicationNumber || '',
        maskedName: user
          ? this.maskName(user.firstName, user.lastName)
          : undefined,
      };

      if (ranking.isPrimary) {
        primaryCandidates.push(item);
      } else {
        waitlistedCandidates.push(item);
      }
    }

    // Get total applicants count
    const totalApplicants = await this.applicationRepository.count({
      where: {
        targetDepartment: department,
        applicationPeriod,
      },
    });

    return {
      department,
      faculty: firstRanking.faculty,
      applicationPeriod,
      publishedAt: firstRanking.publishedAt,
      quota: firstRanking.quota,
      primaryCandidates,
      waitlistedCandidates,
      totalApplicants,
    };
  }

  /**
   * Get all published departments for a period
   */
  async getPublishedDepartments(applicationPeriod: string) {
    const results = await this.rankingRepository
      .createQueryBuilder('ranking')
      .select('DISTINCT ranking.department', 'department')
      .addSelect('ranking.faculty', 'faculty')
      .addSelect('ranking.publishedAt', 'publishedAt')
      .addSelect('ranking.quota', 'quota')
      .where('ranking.applicationPeriod = :applicationPeriod', {
        applicationPeriod,
      })
      .andWhere('ranking.isPublished = :isPublished', { isPublished: true })
      .getRawMany();

    return results;
  }

  /**
   * Check application status by application number (public)
   */
  async checkApplicationStatus(applicationNumber: string) {
    const application = await this.applicationRepository.findOne({
      where: { applicationNumber },
      relations: ['rankings', 'student', 'student.user'],
    });

    if (!application) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    const ranking = application.rankings?.find((r) => r.isPublished);
    const user = application.student?.user;

    return {
      applicationNumber: application.applicationNumber,
      status: application.status,
      maskedName: user
        ? this.maskName(user.firstName, user.lastName)
        : undefined,
      targetDepartment: application.targetDepartment,
      targetFaculty: application.targetFaculty,
      ranking: ranking
        ? {
            rank: ranking.rank,
            isPrimary: ranking.isPrimary,
            isWaitlisted: ranking.isWaitlisted,
            score: Number(ranking.score.toFixed(4)),
          }
        : null,
      resultPublished: !!ranking,
    };
  }

  /**
   * Get detailed result for authenticated student
   */
  async getMyResults(userId: string) {
    const applications = await this.applicationRepository.find({
      where: {
        student: { userId },
      },
      relations: [
        'rankings',
        'evaluations',
        'student',
        'student.user',
      ],
      order: { createdAt: 'DESC' },
    });

    return applications.map((app) => {
      const ranking = app.rankings?.find((r) => r.isPublished);
      const evaluation = app.evaluations?.[0];

      return {
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        status: app.status,
        targetDepartment: app.targetDepartment,
        targetFaculty: app.targetFaculty,
        applicationPeriod: app.applicationPeriod,
        submittedAt: app.submittedAt,
        ranking: ranking
          ? {
              rank: ranking.rank,
              isPrimary: ranking.isPrimary,
              isWaitlisted: ranking.isWaitlisted,
              score: Number(ranking.score.toFixed(4)),
              publishedAt: ranking.publishedAt,
            }
          : null,
        evaluation: evaluation
          ? {
              compositeScore: Number(evaluation.compositeScore?.toFixed(4) || 0),
              isOverallEligible: evaluation.isOverallEligible,
              eligibilityNotes: evaluation.eligibilityNotes,
            }
          : null,
        facultyBoardDecision: app.facultyBoardDecision,
        rejectionReason: app.rejectionReason,
      };
    });
  }

  /**
   * Get results summary for all departments in a period
   */
  async getResultsSummary(applicationPeriod: string) {
    const departments = await this.getPublishedDepartments(applicationPeriod);

    const summary = await Promise.all(
      departments.map(async (dept) => {
        const results = await this.getPublicResults(
          dept.department,
          applicationPeriod,
        );
        return {
          department: dept.department,
          faculty: dept.faculty,
          quota: dept.quota,
          publishedAt: dept.publishedAt,
          primaryCount: results?.primaryCandidates.length || 0,
          waitlistedCount: results?.waitlistedCandidates.length || 0,
          totalApplicants: results?.totalApplicants || 0,
        };
      }),
    );

    return {
      applicationPeriod,
      departments: summary,
      totalPublished: summary.length,
    };
  }

  /**
   * Get application periods with published results
   */
  async getPublishedPeriods() {
    const results = await this.rankingRepository
      .createQueryBuilder('ranking')
      .select('DISTINCT ranking.applicationPeriod', 'applicationPeriod')
      .where('ranking.isPublished = :isPublished', { isPublished: true })
      .getRawMany();

    return results.map((r) => r.applicationPeriod);
  }
}
