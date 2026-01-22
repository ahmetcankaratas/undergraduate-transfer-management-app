import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import {
  Evaluation,
  Application,
  Ranking,
  Staff,
  ProgramBaseScore,
  DepartmentRequirement,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluation,
      Application,
      Ranking,
      Staff,
      ProgramBaseScore,
      DepartmentRequirement,
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
