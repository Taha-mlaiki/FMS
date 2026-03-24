import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'farm_id' })
  @Index()
  farmId!: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column()
  recurrence: string; // daily, weekly, monthly

  @Column({ name: 'recurrence_config', type: 'jsonb', nullable: true })
  recurrenceConfig: any; // e.g. { daysOfWeek: [1, 3, 5] }

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ name: 'time_of_day', nullable: true })
  timeOfDay: string;

  @Column({ name: 'worker_ids', type: 'text', array: true, default: '{}' })
  workerIds: string[];

  @Column({ name: 'group_ids', type: 'text', array: true, default: '{}' })
  groupIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  materials: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
  }>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
