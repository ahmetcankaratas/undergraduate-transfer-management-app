import { Module } from '@nestjs/common';
import { EnglishExemptionService } from './english-exemption.service';
import { EnglishExemptionController } from './english-exemption.controller';

@Module({
  controllers: [EnglishExemptionController],
  providers: [EnglishExemptionService],
  exports: [EnglishExemptionService],
})
export class EnglishExemptionModule {}
