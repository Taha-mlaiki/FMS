import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('metric_records')
export class MetricRecordEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'group_id' })
  @Index()
  groupId: string;

  @Column({ name: 'metric_type_id' })
  @Index()
  metricTypeId: string;

  @Column()
  value: string;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  @Column({ name: 'recorded_by' })
  recordedBy: string;

  @Column({ name: 'task_occurrence_id', nullable: true })
  @Index()
  taskOccurrenceId: string;
}
