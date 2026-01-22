import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Evaluation } from './evaluation.entity';

@Entity('staff')
export class Staff extends BaseEntity {
  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.staff)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  faculty: string;

  @Column({ nullable: true })
  title: string;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.evaluator)
  evaluations: Evaluation[];
}
