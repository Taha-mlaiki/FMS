import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'reports' })
export class ReportEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'farm_id' })
  @Index()
  farmId: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  type: string; // incident, progress, maintenance

  @Column()
  severity: string; // low, medium, high, critical

  @Column({ name: 'task_id', nullable: true })
  @Index()
  taskId?: string;

  @Column({ name: 'group_ids', type: 'text', array: true, default: '{}' })
  @Index()
  groupIds: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
