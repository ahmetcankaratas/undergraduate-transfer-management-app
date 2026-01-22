import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Application } from './application.entity';
import { CourseEquivalence } from './course-equivalence.entity';

@Entity('intibak_tables')
export class IntibakTable extends BaseEntity {
  @Column()
  applicationId: string;

  @OneToOne(() => Application)
  @JoinColumn()
  application: Application;

  @OneToMany(() => CourseEquivalence, (equivalence) => equivalence.intibakTable, {
    cascade: true,
  })
  equivalences: CourseEquivalence[];

  @Column({ default: false })
  isApproved: boolean;

  @Column({ nullable: true })
  approvedBy: string; // Staff ID

  @Column({ nullable: true })
  finalizedAt: Date;
}
