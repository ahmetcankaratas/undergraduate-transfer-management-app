import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '../../common/enums';

@Controller('evaluation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('application/:applicationId')
  @Roles(UserRole.YGK_MEMBER)
  async createEvaluation(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    return this.evaluationService.createEvaluation(applicationId, user.id);
  }

  @Post(':id/evaluate')
  @Roles(UserRole.YGK_MEMBER)
  async evaluate(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body()
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
    return this.evaluationService.evaluate(id, user.id, data);
  }

  @Get('application/:applicationId')
  @Roles(UserRole.YGK_MEMBER, UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF)
  async getByApplication(@Param('applicationId') applicationId: string) {
    return this.evaluationService.getByApplication(applicationId);
  }

  @Post('rankings/generate')
  @Roles(UserRole.YGK_MEMBER)
  async generateRankings(
    @Body()
    data: {
      department: string;
      faculty: string;
      applicationPeriod: string;
      quota: number;
    },
  ) {
    return this.evaluationService.generateRankings(
      data.department,
      data.faculty,
      data.applicationPeriod,
      data.quota,
    );
  }

  @Get('rankings')
  @Roles(UserRole.YGK_MEMBER, UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF)
  async getRankings(
    @Query('department') department: string,
    @Query('applicationPeriod') applicationPeriod: string,
  ) {
    return this.evaluationService.getRankings(department, applicationPeriod);
  }

  @Post('rankings/publish')
  @Roles(UserRole.OIDB_STAFF)
  async publishRankings(
    @Body() data: { department: string; applicationPeriod: string },
  ) {
    return this.evaluationService.publishRankings(
      data.department,
      data.applicationPeriod,
    );
  }

  /**
   * OIDB için duyuruya hazır sıralamaları getir
   * GET /api/evaluation/rankings/for-announcement
   */
  @Get('rankings/for-announcement')
  @Roles(UserRole.OIDB_STAFF)
  async getRankingsForAnnouncement() {
    return this.evaluationService.getRankingsForAnnouncement();
  }

  /**
   * Belirli bir bölümün en son sıralamalarını getir
   * GET /api/evaluation/rankings/latest/:department
   */
  @Get('rankings/latest/:department')
  @Roles(UserRole.OIDB_STAFF, UserRole.YGK_MEMBER)
  async getLatestRankingsByDepartment(@Param('department') department: string) {
    return this.evaluationService.getLatestRankingsByDepartment(department);
  }

  // Program Base Score Management
  @Post('base-scores')
  @Roles(UserRole.OIDB_STAFF, UserRole.ADMIN)
  async createProgramBaseScore(
    @Body()
    data: {
      department: string;
      faculty: string;
      year: number;
      baseScore: number;
      baseRank?: number;
      scoreType?: string;
    },
  ) {
    return this.evaluationService.createProgramBaseScore(data);
  }

  @Get('base-scores')
  @Roles(UserRole.YGK_MEMBER, UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getProgramBaseScores(
    @Query('department') department?: string,
    @Query('faculty') faculty?: string,
  ) {
    return this.evaluationService.getProgramBaseScores(department, faculty);
  }

  // Department Requirements Management
  @Post('department-requirements')
  @Roles(UserRole.OIDB_STAFF, UserRole.ADMIN)
  async createDepartmentRequirement(
    @Body()
    data: {
      department: string;
      faculty: string;
      requirementType: string;
      courseName?: string;
      minimumGrade?: string;
      description?: string;
      descriptionEn?: string;
      requiresPortfolio?: boolean;
    },
  ) {
    return this.evaluationService.createDepartmentRequirement(data);
  }

  @Get('department-requirements')
  @Roles(UserRole.YGK_MEMBER, UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getDepartmentRequirements(
    @Query('department') department: string,
    @Query('faculty') faculty: string,
  ) {
    return this.evaluationService.getDepartmentRequirements(department, faculty);
  }
}
