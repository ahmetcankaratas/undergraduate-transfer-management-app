import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { IntibakModule } from './modules/intibak/intibak.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { ResultsModule } from './modules/results/results.module';
import { EnglishExemptionModule } from './modules/english-exemption/english-exemption.module';
import { YgkModule } from './modules/ygk/ygk.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    DocumentsModule,
    EvaluationModule,
    NotificationsModule,
    IntegrationsModule,
    IntibakModule,
    FacultyModule,
    ResultsModule,
    EnglishExemptionModule,
    YgkModule,
  ],
})
export class AppModule {}
