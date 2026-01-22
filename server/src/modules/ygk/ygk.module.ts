import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YgkController } from './ygk.controller';
import { YgkService } from './ygk.service';
import {
  Application,
  Evaluation,
  Ranking,
  Staff,
  ProgramBaseScore,
  DepartmentRequirement,
  Quota,
} from '../../entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Evaluation,
      Ranking,
      Staff,
      ProgramBaseScore,
      DepartmentRequirement,
      Quota,
    ]),
    NotificationsModule,
  ],
  controllers: [YgkController],
  providers: [YgkService],
  exports: [YgkService],
})
export class YgkModule {}
