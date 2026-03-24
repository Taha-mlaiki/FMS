import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('mortality_records')
export class MortalityRecordEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'group_id' })
  @Index()
  groupId: string;

  @Column()
  count: number;

  @Column({ nullable: true })
  cause: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'recorded_by' })
  recordedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
