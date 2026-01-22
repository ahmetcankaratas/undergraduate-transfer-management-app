import { Entity, Column, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApplicationStatus } from '../common/enums';
import { Student } from './student.entity';
import { Document } from './document.entity';
import { Evaluation } from './evaluation.entity';
import { Ranking } from './ranking.entity';
import { IntibakTable } from './intibak-table.entity';

@Entity('applications')
export class Application extends BaseEntity {
  @Column()
  studentId: string;

  @ManyToOne(() => Student, (student) => student.applications)
  @JoinColumn()
  student: Student;

  @Column({ unique: true })
  applicationNumber: string;

  @Column({
    type: 'varchar',
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column()
  targetFaculty: string;

  @Column()
  targetDepartment: string;

  @Column({ nullable: true })
  applicationPeriod: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  declaredGpa: number;

  @Column('float', { nullable: true })
  declaredOsymScore: number;

  @Column({ nullable: true })
  declaredOsymRank: number;

  @Column({ nullable: true })
  declaredOsymYear: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  routedToFacultyAt: Date;

  @Column({ nullable: true })
  routedToDepartmentAt: Date;

  @Column({ nullable: true })
  facultyBoardDecision: string;

  @Column({ nullable: true })
  facultyBoardDecisionAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => Document, (document) => document.application)
  documents: Document[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.application)
  evaluations: Evaluation[];

  @OneToMany(() => Ranking, (ranking) => ranking.application)
  rankings: Ranking[];

  @OneToOne(() => IntibakTable, (intibakTable) => intibakTable.application)
  intibakTable: IntibakTable;
}
