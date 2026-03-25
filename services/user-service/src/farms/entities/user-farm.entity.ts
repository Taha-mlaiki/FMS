import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FarmRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  CONSULTANT = 'CONSULTANT',
}

@Entity('user_farms', { schema: 'public' })
export class UserFarm {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  farmId: string;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: FarmRole,
    default: FarmRole.WORKER,
  })
  role: FarmRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}
