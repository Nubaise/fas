import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { NotificationJobEntity } from '../../notification-jobs/entities/notification-job.entity.js';
import { UserEntity } from '../../users/entities/user.entity.js';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => NotificationJobEntity, { nullable: true })
  @JoinColumn({ name: 'notification_job_id' })
  notificationJob: NotificationJobEntity | null;

  @Column({ name: 'notification_job_id', nullable: true })
  notificationJobId: string | null;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
