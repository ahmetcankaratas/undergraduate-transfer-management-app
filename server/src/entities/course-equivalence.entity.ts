import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { IntibakTable } from './intibak-table.entity';
import { Course } from './course.entity';

@Entity('course_equivalences')
export class CourseEquivalence extends BaseEntity {
  @Column()
  intibakTableId: string;

  @ManyToOne(() => IntibakTable, (intibakTable) => intibakTable.equivalences)
  @JoinColumn()
  intibakTable: IntibakTable;

  @Column()
  sourceCourseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'sourceCourseId' })
  sourceCourse: Course;

  @Column()
  targetCourseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'targetCourseId' })
  targetCourse: Course;

  @Column({ default: false })
  isMatch: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
