import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Application } from './application.entity';
import { Staff } from './staff.entity';

@Entity('evaluations')
export class Evaluation extends BaseEntity {
  @Column()
  applicationId: string;

  @ManyToOne(() => Application, (application) => application.evaluations)
  @JoinColumn()
  application: Application;

  @Column()
  evaluatorId: string;

  @ManyToOne(() => Staff, (staff) => staff.evaluations)
  @JoinColumn({ name: 'evaluatorId' })
  evaluator: Staff;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  verifiedGpa: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  verifiedGpa100: number; // GPA converted to 100 scale using YÖK table

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  verifiedOsymScore: number;

  @Column({ nullable: true })
  verifiedOsymRank: number; // ÖSYM sıralaması

  @Column({ nullable: true })
  verifiedOsymYear: number; // ÖSYM kayıt yılı

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  programBaseScore: number; // Program taban puanı (y değeri)

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  compositeScore: number; // Yatay geçiş puanı

  @Column({ default: false })
  isGpaEligible: boolean;

  @Column({ default: false })
  isOsymEligible: boolean;

  @Column({ default: false })
  isOsymRankEligible: boolean; // ÖSYM sıralama uygunluğu (Müh: 300K, Mim: 250K)

  @Column({ default: false })
  isEnglishEligible: boolean;

  @Column({ default: false })
  isIyteEnglishExempt: boolean; // İYTE Yabancı Diller YO muafiyeti

  @Column({ default: false })
  isDepartmentRequirementsMet: boolean; // Bölüm özel şartları

  @Column({ type: 'text', nullable: true })
  departmentRequirementsNotes: string;

  @Column({ default: false })
  isOverallEligible: boolean;

  @Column({ type: 'text', nullable: true })
  eligibilityNotes: string;

  @Column({ type: 'text', nullable: true })
  evaluationNotes: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  completedAt: Date;
}
