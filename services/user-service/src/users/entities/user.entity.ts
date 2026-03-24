import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserFarm } from '../../farms/entities/user-farm.entity';

export enum UserRole {
  OWNER = 'OWNER',
  WORKER = 'WORKER',
}

@Entity('users', { schema: 'public' })
export class User {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OWNER,
  })
  role: UserRole;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  // Global Refresh Token handling
  @Column({ type: 'text', nullable: true })
  currentHashedRefreshToken: string | null;

  @OneToMany(() => UserFarm, (userFarm) => userFarm.user)
  memberships: UserFarm[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
