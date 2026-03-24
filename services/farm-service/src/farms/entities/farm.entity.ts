import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FarmStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  PENDING_DELETION = 'PENDING_DELETION',
}

@Entity('farms', { schema: 'public' })
export class Farm {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  type: string;

  @Column({
    type: 'enum',
    enum: FarmStatus,
    default: FarmStatus.ACTIVE,
  })
  status: FarmStatus;

  // Defines the physical schema name (e.g., 'farm_uuid')
  @Column({ unique: true })
  schemaName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
