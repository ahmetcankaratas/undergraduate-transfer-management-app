import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Student,
  Staff,
  Application,
  Document,
  Evaluation,
  Ranking,
  Notification,
  AuditLog,
  Course,
  IntibakTable,
  CourseEquivalence,
  ProgramBaseScore,
  DepartmentRequirement,
  Quota,
  FacultyBoardDecision,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get<string>('database.database'),
        entities: [
          User,
          Student,
          Staff,
          Application,
          Document,
          Evaluation,
          Ranking,
          Notification,
          AuditLog,
          Course,
          IntibakTable,
          CourseEquivalence,
          ProgramBaseScore,
          DepartmentRequirement,
          Quota,
          FacultyBoardDecision,
        ],
        synchronize: configService.get<string>('database.synchronize') !== 'false',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
