import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Application } from './application.entity';

@Entity('rankings')
export class Ranking extends BaseEntity {
  @Column()
  applicationId: string;

  @ManyToOne(() => Application, (application) => application.rankings)
  @JoinColumn()
  application: Application;

  @Column()
  department: string;

  @Column()
  faculty: string;

  @Column()
  applicationPeriod: string;

  @Column()
  rank: number;

  @Column({ type: 'decimal', precision: 6, scale: 3 })
  score: number;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: false })
  isWaitlisted: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  quota: number;
}
