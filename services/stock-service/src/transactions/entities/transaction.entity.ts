import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionType {
  PURCHASE = 'purchase',
  CONSUMPTION = 'consumption',
  DAMAGE = 'damage',
  ADJUSTMENT = 'adjustment',
}

@Entity({ name: 'material_transactions' })
export class TransactionEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'material_id' })
  @Index()
  materialId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'double precision' })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'double precision', default: 0 })
  unitCost: number;

  @Column({ name: 'total_cost', type: 'double precision', default: 0 })
  totalCost: number;

  @Column({ name: 'quantity_before', type: 'double precision' })
  quantityBefore: number;

  @Column({ name: 'quantity_after', type: 'double precision' })
  quantityAfter: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'reference_id', nullable: true })
  @Index()
  referenceId: string; // e.g., task_occurrence_id

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
