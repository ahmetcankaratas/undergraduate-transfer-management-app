import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../entities';
import { IntegrationsService } from './integrations.service';
import {
  FetchTranscriptDto,
  FetchOsymScoreDto,
  FetchEnglishCertDto,
  FetchIdentityDto,
} from './dto/external-data.dto';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('universities')
  getUniversities() {
    return this.integrationsService.getUniversities();
  }

  @Post('ubys/transcript')
  async fetchTranscript(@Body() dto: FetchTranscriptDto, @CurrentUser() user: User) {
    return this.integrationsService.fetchTranscriptFromUbys(
      dto.tcKimlikNo,
      dto.universityCode,
      user.id,
    );
  }

  @Post('osym/score')
  async fetchOsymScore(@Body() dto: FetchOsymScoreDto, @CurrentUser() user: User) {
    return this.integrationsService.fetchOsymScore(dto.tcKimlikNo, dto.examYear, user.id);
  }

  @Post('yoksis/english')
  async fetchEnglishCert(@Body() dto: FetchEnglishCertDto, @CurrentUser() user: User) {
    return this.integrationsService.fetchEnglishCertFromYoksis(dto.tcKimlikNo, user.id);
  }

  @Post('edevlet/identity')
  async fetchIdentity(@Body() dto: FetchIdentityDto, @CurrentUser() user: User) {
    return this.integrationsService.fetchIdentityFromEDevlet(dto.tcKimlikNo, user.id);
  }

  @Post('fetch-all')
  async fetchAllDocuments(
    @Body()
    dto: {
      tcKimlikNo: string;
      universityCode: string;
      examYear: number;
    },
    @CurrentUser() user: User,
  ) {
    return this.integrationsService.fetchAllDocuments(
      dto.tcKimlikNo,
      dto.universityCode,
      dto.examYear,
      user.id,
    );
  }
}
