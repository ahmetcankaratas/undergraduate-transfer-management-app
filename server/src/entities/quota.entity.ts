import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Kontenjan Bilgisi
 * Yönerge MADDE 5: Kontenjanlar YÖK tarafından belirlenir
 * 3. ve 5. yarıyıllara kontenjan belirlenir (güz yarıyılı)
 */
@Entity('quotas')
@Unique(['department', 'faculty', 'semester', 'academicYear'])
export class Quota extends BaseEntity {
  @Column()
  department: string;

  @Column()
  faculty: string;

  @Column()
  semester: number; // 3 veya 5

  @Column()
  academicYear: string; // 2024-2025

  @Column()
  quota: number;

  @Column({ default: 0 })
  filledCount: number;

  @Column({ default: true })
  isActive: boolean;
}
