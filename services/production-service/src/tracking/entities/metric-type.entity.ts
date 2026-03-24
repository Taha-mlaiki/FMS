import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('metric_types')
export class MetricTypeEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column({ name: 'data_type' })
  dataType: string; // number, boolean, text

  @Column()
  category: string; // production, health, environment
}
