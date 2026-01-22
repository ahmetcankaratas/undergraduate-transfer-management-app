import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Application } from './application.entity';
import { Staff } from './staff.entity';

/**
 * Fakülte Kurulu Kararı
 * Yönerge MADDE 9-(9): Asil ve yedek adaylar ile intibak formları ve
 * geçersiz başvurular (red nedeni ile birlikte) fakülte yönetim kurulu kararı ile ÖİDB'ye gönderilir.
 */
export enum FacultyBoardDecisionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONDITIONAL = 'CONDITIONAL',
  PENDING = 'PENDING',
}

@Entity('faculty_board_decisions')
export class FacultyBoardDecision extends BaseEntity {
  @Column()
  applicationId: string;

  @ManyToOne(() => Application)
  @JoinColumn()
  application: Application;

  @Column({
    type: 'varchar',
    default: FacultyBoardDecisionType.PENDING,
  })
  decision: FacultyBoardDecisionType;

  @Column({ nullable: true })
  meetingDate: Date;

  @Column({ nullable: true })
  meetingNumber: string; // Toplantı no: örn. 2024/15

  @Column({ nullable: true })
  decisionNumber: string; // Karar no

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  conditions: string; // Şartlı kabul için koşullar

  @Column({ nullable: true })
  decidedBy?: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'decidedBy' })
  decider: Staff;

  @Column({ nullable: true })
  decidedAt: Date;

  @Column({ nullable: true })
  sentToOidbAt: Date;

  @Column({ default: false })
  isSentToOidb: boolean;
}
