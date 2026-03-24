import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GroupStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CLOSED = 'closed',
}

@Entity('animal_groups')
export class AnimalGroup {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // broiler, layer, etc.

  @Column({ name: 'initial_quantity', default: 0 })
  initialQuantity: number;

  @Column({ name: 'current_quantity', default: 0 })
  currentQuantity: number;

  @Column({ name: 'arrival_date', type: 'date' })
  arrivalDate: string;

  @Column({ nullable: true })
  breed: string;

  @Column({ nullable: true })
  building: string;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.ACTIVE,
  })
  status: GroupStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
