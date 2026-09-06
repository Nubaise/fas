import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FacultyEntity } from '../../faculty/entities/faculty.entity.js';

@Entity('availability_exceptions')
export class AvailabilityExceptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FacultyEntity)
  @JoinColumn({ name: 'faculty_id' })
  faculty: FacultyEntity;

  @Column({ name: 'faculty_id' })
  facultyId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
