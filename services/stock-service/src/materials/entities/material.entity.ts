import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'materials' })
export class MaterialEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'farm_id', type: 'uuid', nullable: false })
  farmId: string;

  @Column()
  name: string;

  @Column()
  category: string; // feed, vaccine, medicine, equipment, other

  @Column()
  unit: string; // kg, litre, piece, dose

  @Column({ type: 'double precision', default: 0 })
  quantity: number;

  @Column({ name: 'min_threshold', type: 'double precision', default: 0 })
  minThreshold: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
