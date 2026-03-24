import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskStatus {
  TODO = 'todo',
  DOING = 'doing',
  DONE = 'done',
  SKIPPED = 'skipped',
}

@Entity('tasks')
export class Task {
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

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  @Index()
  templateId: string | null;

  @Column({
    type: 'varchar',
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({ name: 'scheduled_date', type: 'date' })
  @Index()
  scheduledDate: Date;

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

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'completed_by', nullable: true })
  completedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
