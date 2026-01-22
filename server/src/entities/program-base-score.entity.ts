import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Program Taban Puanları
 * Yönerge MADDE 9: Yatay geçiş puanı hesabında kullanılır
 * y: Adayın geçiş yapmak istediği programın adayın kayıt olduğu yıldaki taban puanı
 */
@Entity('program_base_scores')
@Unique(['department', 'faculty', 'year'])
export class ProgramBaseScore extends BaseEntity {
  @Column()
  department: string;

  @Column()
  faculty: string;

  @Column()
  year: number;

  @Column('float')
  baseScore: number;

  @Column('float', { nullable: true })
  baseRank: number;

  @Column({ nullable: true })
  scoreType: string; // SAY, EA, SÖZ, DİL

  @Column({ default: true })
  isActive: boolean;
}
