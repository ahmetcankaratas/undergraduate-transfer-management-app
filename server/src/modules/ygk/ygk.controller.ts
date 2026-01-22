import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { YgkService } from './ygk.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '../../common/enums';

@Controller('ygk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.YGK_MEMBER, UserRole.ADMIN)
export class YgkController {
  constructor(private readonly ygkService: YgkService) {}

  /**
   * YGK değerlendirmesi bekleyen başvuruları listele
   * GET /api/ygk/pending
   */
  @Get('pending')
  async getPendingApplications(
    @Query('department') department?: string,
    @Query('faculty') faculty?: string,
  ) {
    return this.ygkService.getPendingApplications(department, faculty);
  }

  /**
   * Değerlendirme bekleyen bölümleri listele
   * GET /api/ygk/pending-departments
   */
  @Get('pending-departments')
  async getPendingDepartments() {
    return this.ygkService.getPendingDepartments();
  }

  /**
   * Belirli bir başvuruyu getir (detaylı)
   * GET /api/ygk/applications/:id
   */
  @Get('applications/:id')
  async getApplication(@Param('id') id: string) {
    return this.ygkService.getApplication(id);
  }

  /**
   * Değerlendirme başlat veya mevcut değerlendirmeyi getir
   * POST /api/ygk/applications/:id/start-evaluation
   */
  @Post('applications/:id/start-evaluation')
  async startEvaluation(
    @Param('id') applicationId: string,
    @CurrentUser() user: any,
  ) {
    return this.ygkService.createOrGetEvaluation(applicationId, user.id);
  }

  /**
   * Değerlendirme yap ve kaydet
   * POST /api/ygk/evaluations/:id/evaluate
   */
  @Post('evaluations/:id/evaluate')
  async evaluate(
    @Param('id') evaluationId: string,
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
    return this.ygkService.evaluate(evaluationId, user.id, data);
  }

  /**
   * Sıralama oluştur
   * POST /api/ygk/rankings/generate
   */
  @Post('rankings/generate')
  async generateRankings(
    @Body()
    data: {
      department: string;
      faculty: string;
      applicationPeriod: string;
    },
  ) {
    return this.ygkService.generateRankings(
      data.department,
      data.faculty,
      data.applicationPeriod,
    );
  }

  /**
   * Sıralamaları getir
   * GET /api/ygk/rankings
   */
  @Get('rankings')
  async getRankings(
    @Query('department') department: string,
    @Query('applicationPeriod') applicationPeriod: string,
  ) {
    return this.ygkService.getRankings(department, applicationPeriod);
  }

  /**
   * Sıralamaları Fakülte Kuruluna gönder
   * POST /api/ygk/rankings/send-to-faculty
   */
  @Post('rankings/send-to-faculty')
  async sendToFacultyBoard(
    @Body() data: { department: string; applicationPeriod: string },
  ) {
    return this.ygkService.sendRankingsToFacultyBoard(
      data.department,
      data.applicationPeriod,
    );
  }

  /**
   * YGK istatistikleri
   * GET /api/ygk/statistics
   */
  @Get('statistics')
  async getStatistics(
    @Query('department') department?: string,
    @Query('faculty') faculty?: string,
  ) {
    return this.ygkService.getStatistics(department, faculty);
  }
}
