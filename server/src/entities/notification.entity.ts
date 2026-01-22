import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn()
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'INFO' })
  type: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  applicationId: string;

  @Column({ nullable: true })
  link: string;
}
