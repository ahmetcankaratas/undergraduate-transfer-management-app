import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntibakService } from './intibak.service';
import { IntibakController } from './intibak.controller';
import {
  IntibakTable,
  CourseEquivalence,
  Course,
  Application,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntibakTable,
      CourseEquivalence,
      Course,
      Application,
    ]),
  ],
  controllers: [IntibakController],
  providers: [IntibakService],
  exports: [IntibakService],
})
export class IntibakModule {}
