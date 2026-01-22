import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EnglishExemptionService } from './english-exemption.service';
import type { EnglishExamScore } from './english-exemption.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../common/enums';

@Controller('english-exemption')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnglishExemptionController {
  constructor(private readonly exemptionService: EnglishExemptionService) {}

  /**
   * Check exemption status for a student
   */
  @Get('check')
  @Roles(UserRole.YGK_MEMBER, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async checkExemptionStatus(
    @Query('studentId') studentId: string,
    @Query('tcKimlikNo') tcKimlikNo?: string,
  ) {
    return this.exemptionService.checkExemptionStatus(studentId, tcKimlikNo);
  }

  /**
   * Verify exam score for exemption
   */
  @Post('verify-exam')
  @Roles(UserRole.YGK_MEMBER, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async verifyExamScore(@Body() examData: EnglishExamScore) {
    return this.exemptionService.verifyExamScore(examData);
  }

  /**
   * Check university medium for exemption
   */
  @Post('check-university')
  @Roles(UserRole.YGK_MEMBER, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async checkUniversityMedium(
    @Body() data: { universityName: string; programName: string },
  ) {
    return this.exemptionService.checkUniversityMedium(
      data.universityName,
      data.programName,
    );
  }

  /**
   * Get minimum score requirements for all exam types
   */
  @Get('requirements')
  @Roles(UserRole.STUDENT, UserRole.YGK_MEMBER, UserRole.OIDB_STAFF, UserRole.ADMIN)
  async getMinimumScoreRequirements() {
    return this.exemptionService.getMinimumScoreRequirements();
  }
}
