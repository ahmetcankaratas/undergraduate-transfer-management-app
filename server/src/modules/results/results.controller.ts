import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser, Public } from '../../auth/decorators';
import { UserRole } from '../../common/enums';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  /**
   * Get published results for a department (PUBLIC - no auth required)
   * Yönerge MADDE 10: Sonuçlar ÖİDB internet sayfasında yayınlanır
   */
  @Get('public/:department')
  @Public()
  async getPublicResults(
    @Param('department') department: string,
    @Query('period') applicationPeriod: string,
  ) {
    if (!applicationPeriod) {
      throw new NotFoundException('Application period is required');
    }

    const results = await this.resultsService.getPublicResults(
      department,
      applicationPeriod,
    );

    if (!results) {
      throw new NotFoundException('Sonuçlar henüz yayınlanmadı');
    }

    return results;
  }

  /**
   * Get all departments with published results (PUBLIC)
   */
  @Get('public/departments/list')
  @Public()
  async getPublishedDepartments(@Query('period') applicationPeriod: string) {
    if (!applicationPeriod) {
      throw new NotFoundException('Application period is required');
    }
    return this.resultsService.getPublishedDepartments(applicationPeriod);
  }

  /**
   * Get published application periods (PUBLIC)
   */
  @Get('public/periods')
  @Public()
  async getPublishedPeriods() {
    return this.resultsService.getPublishedPeriods();
  }

  /**
   * Check application status by application number (PUBLIC)
   */
  @Get('check/:applicationNumber')
  @Public()
  async checkApplicationStatus(
    @Param('applicationNumber') applicationNumber: string,
  ) {
    return this.resultsService.checkApplicationStatus(applicationNumber);
  }

  /**
   * Get results summary for a period (PUBLIC)
   */
  @Get('summary')
  @Public()
  async getResultsSummary(@Query('period') applicationPeriod: string) {
    if (!applicationPeriod) {
      throw new NotFoundException('Application period is required');
    }
    return this.resultsService.getResultsSummary(applicationPeriod);
  }

  /**
   * Get my results (authenticated student)
   */
  @Get('my-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async getMyResults(@CurrentUser() user: any) {
    return this.resultsService.getMyResults(user.id);
  }

  /**
   * Get detailed results for admin/staff
   */
  @Get('admin/department/:department')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OIDB_STAFF, UserRole.FACULTY_STAFF, UserRole.YGK_MEMBER, UserRole.ADMIN)
  async getAdminResults(
    @Param('department') department: string,
    @Query('period') applicationPeriod: string,
  ) {
    if (!applicationPeriod) {
      throw new NotFoundException('Application period is required');
    }

    // For admin, include more details
    const results = await this.resultsService.getPublicResults(
      department,
      applicationPeriod,
    );

    if (!results) {
      throw new NotFoundException('Sonuçlar bulunamadı');
    }

    return results;
  }
}
