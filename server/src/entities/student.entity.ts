import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Application } from './application.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.student)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  tcKimlikNo: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  currentUniversity: string;

  @Column({ nullable: true })
  currentDepartment: string;

  @Column({ nullable: true })
  currentFaculty: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  gpa: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  osymScore: number;

  @Column({ nullable: true })
  osymYear: number;

  @Column({ nullable: true })
  englishProficiencyType: string;

  @Column({ nullable: true })
  englishProficiencyScore: string;

  @Column({ default: false })
  hasEnglishExemption: boolean;

  @OneToMany(() => Application, (application) => application.student)
  applications: Application[];
}
