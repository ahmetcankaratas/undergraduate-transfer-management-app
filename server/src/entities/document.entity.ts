import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DocumentType } from '../common/enums';
import { Application } from './application.entity';

@Entity('documents')
export class Document extends BaseEntity {
  @Column()
  applicationId: string;

  @ManyToOne(() => Application, (application) => application.documents)
  @JoinColumn()
  application: Application;

  @Column({
    type: 'varchar',
  })
  type: DocumentType;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'text', nullable: true })
  verificationNotes: string;
}
