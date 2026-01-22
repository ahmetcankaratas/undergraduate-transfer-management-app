import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole, ApplicationStatus } from '../../common/enums';
import { FacultyBoardDecisionType } from '../../entities/faculty-board-decision.entity';

@Controller('faculty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  /**
   * Fakülteye yönlendirilmiş tüm başvuruları listele
   */
  @Get('applications')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getApplications(
    @CurrentUser() user: any,
    @Query('faculty') faculty?: string,
    @Query('status') status?: ApplicationStatus,
  ) {
    const targetFaculty = faculty || user.staff?.faculty;
    if (!targetFaculty) {
      return { error: 'Faculty not specified' };
    }
    return this.facultyService.getApplicationsForFaculty(targetFaculty, status);
  }

  /**
   * Bölüme yönlendirilmeyi bekleyen başvurular
   */
  @Get('pending-routing')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getPendingRouting(
    @CurrentUser() user: any,
    @Query('faculty') faculty?: string,
  ) {
    const targetFaculty = faculty || user.staff?.faculty;
    if (!targetFaculty) {
      return { error: 'Faculty not specified' };
    }
    return this.facultyService.getPendingDepartmentRouting(targetFaculty);
  }

  /**
   * Başvuruları bölüme toplu yönlendir
   */
  @Post('route-to-department')
  @Roles(UserRole.FACULTY_STAFF)
  async routeToDepartment(
    @CurrentUser() user: any,
    @Body() data: { applicationIds: string[] },
  ) {
    return this.facultyService.routeApplicationsToDepartment(
      data.applicationIds,
      user.id,
    );
  }

  /**
   * Fakülte ön incelemesinde başvuruyu reddet
   */
  @Post('reject-application')
  @Roles(UserRole.FACULTY_STAFF)
  async rejectApplication(
    @CurrentUser() user: any,
    @Body() data: { applicationId: string; reason: string; notes?: string },
  ) {
    return this.facultyService.rejectApplicationAtFacultyReview(
      data.applicationId,
      user.id,
      data.reason,
      data.notes,
    );
  }

  /**
   * Fakülte Kurulu kararı bekleyen başvurular
   */
  @Get('pending-board-decisions')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getPendingBoardDecisions(
    @CurrentUser() user: any,
    @Query('faculty') faculty?: string,
  ) {
    const targetFaculty = faculty || user.staff?.faculty;
    if (!targetFaculty) {
      return { error: 'Faculty not specified' };
    }
    return this.facultyService.getPendingBoardDecisions(targetFaculty);
  }

  /**
   * Tekil Fakülte Kurulu kararı oluştur
   */
  @Post('board-decision')
  @Roles(UserRole.FACULTY_STAFF)
  async createBoardDecision(
    @CurrentUser() user: any,
    @Body()
    data: {
      applicationId: string;
      decision: FacultyBoardDecisionType;
      meetingDate?: Date;
      meetingNumber?: string;
      decisionNumber?: string;
      notes?: string;
      conditions?: string;
    },
  ) {
    return this.facultyService.createBoardDecision(
      data.applicationId,
      user.id,
      data,
    );
  }

  /**
   * Toplu Fakülte Kurulu kararı oluştur
   */
  @Post('board-decisions/bulk')
  @Roles(UserRole.FACULTY_STAFF)
  async createBulkBoardDecisions(
    @CurrentUser() user: any,
    @Body()
    data: {
      decisions: Array<{
        applicationId: string;
        decision: FacultyBoardDecisionType;
        notes?: string;
        conditions?: string;
      }>;
      meetingInfo: {
        meetingDate: Date;
        meetingNumber: string;
      };
    },
  ) {
    return this.facultyService.createBulkBoardDecisions(
      user.id,
      data.decisions,
      data.meetingInfo,
    );
  }

  /**
   * Fakülte Kurulu kararlarını ÖİDB'ye gönder
   */
  @Post('board-decisions/send-to-oidb')
  @Roles(UserRole.FACULTY_STAFF)
  async sendDecisionsToOidb(
    @CurrentUser() user: any,
    @Body() data: { faculty: string; applicationPeriod: string },
  ) {
    const targetFaculty = data.faculty || user.staff?.faculty;
    return this.facultyService.sendDecisionsToOidb(
      targetFaculty,
      data.applicationPeriod,
    );
  }

  /**
   * Fakülte Kurulu karar özeti
   */
  @Get('board-decisions/summary')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getBoardDecisionSummary(
    @CurrentUser() user: any,
    @Query('faculty') faculty?: string,
    @Query('applicationPeriod') applicationPeriod?: string,
  ) {
    const targetFaculty = faculty || user.staff?.faculty;
    if (!targetFaculty || !applicationPeriod) {
      return { error: 'Faculty and applicationPeriod are required' };
    }
    return this.facultyService.getBoardDecisionSummary(
      targetFaculty,
      applicationPeriod,
    );
  }

  /**
   * Bölüm bazında istatistikler
   */
  @Get('statistics/departments')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getDepartmentStatistics(
    @CurrentUser() user: any,
    @Query('faculty') faculty?: string,
    @Query('applicationPeriod') applicationPeriod?: string,
  ) {
    const targetFaculty = faculty || user.staff?.faculty;
    if (!targetFaculty) {
      return { error: 'Faculty not specified' };
    }
    return this.facultyService.getDepartmentStatistics(
      targetFaculty,
      applicationPeriod,
    );
  }

  /**
   * Kontenjan listesi
   */
  @Get('quotas')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.YGK_MEMBER, UserRole.ADMIN)
  async getQuotas(
    @CurrentUser() user: any,
    @Query('faculty') faculty?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    const targetFaculty = faculty || user.staff?.faculty;
    const year = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    if (!targetFaculty) {
      return { error: 'Faculty not specified' };
    }
    return this.facultyService.getQuotas(targetFaculty, year);
  }

  /**
   * Kontenjan oluştur
   */
  @Post('quotas')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async createQuota(
    @Body()
    data: {
      department: string;
      faculty: string;
      semester: number;
      academicYear: string;
      quota: number;
    },
  ) {
    return this.facultyService.createQuota(data);
  }

  /**
   * Kontenjan güncelle
   */
  @Patch('quotas/:id')
  @Roles(UserRole.FACULTY_STAFF, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async updateQuota(
    @Param('id') id: string,
    @Body() data: { quota?: number; filledCount?: number },
  ) {
    return this.facultyService.updateQuota(id, data);
  }
}
