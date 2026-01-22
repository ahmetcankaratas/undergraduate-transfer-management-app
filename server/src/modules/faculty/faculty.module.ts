import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import {
  Application,
  Staff,
  FacultyBoardDecision,
  Ranking,
  Quota,
} from '../../entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Staff,
      FacultyBoardDecision,
      Ranking,
      Quota,
    ]),
    NotificationsModule,
  ],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
