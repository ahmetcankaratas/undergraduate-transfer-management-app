import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { IntibakTable } from './intibak-table.entity';
import { Student } from './student.entity';

export enum CourseType {
  PREVIOUS = 'PREVIOUS',
  TARGET = 'TARGET',
}

@Entity('courses')
export class Course extends BaseEntity {
  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  credits: number;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  semester: string;

  @Column({
    type: 'varchar',
    default: CourseType.PREVIOUS,
  })
  type: CourseType;

  // Optional: Link to student if these are the student's previous courses
  @Column({ nullable: true })
  studentId: string;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;
}
