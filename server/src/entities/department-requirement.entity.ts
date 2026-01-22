import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Bölüm Özel Şartları
 * Yönerge MADDE 6-(7): Bölümler ilgili fakülte yönetim kurulu kararı ile ek başvuru koşulları belirleyebilir.
 *
 * Örnek şartlar:
 * - İnşaat Mühendisliği: Fizik ve Matematik dersleri >= BB
 * - Mimarlık: Son tasarım dersi = AA, Portfolio gerekli
 * - Endüstriyel Tasarım: Son tasarım stüdyosu = AA
 */
@Entity('department_requirements')
export class DepartmentRequirement extends BaseEntity {
  @Column()
  department: string;

  @Column()
  faculty: string;

  @Column()
  requirementType: string; // COURSE_GRADE, PORTFOLIO, CUSTOM

  @Column({ nullable: true })
  courseName: string; // Fizik, Matematik, Tasarım vb.

  @Column({ nullable: true })
  minimumGrade: string; // BB, AA vb.

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  descriptionEn: string;

  @Column({ default: false })
  requiresPortfolio: boolean;

  @Column({ default: true })
  isActive: boolean;
}
