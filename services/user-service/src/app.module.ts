import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@shared/database/database.module';

import { User } from './users/entities/user.entity';
import { UserFarm } from './farms/entities/user-farm.entity';
import { Invitation } from './farms/entities/invitation.entity';

import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pass = configService.get<string>('DB_PASSWORD');
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'postgres',
          database: configService.get<string>('DB_NAME') || 'FMS_user_service',
          entities: [User, UserFarm, Invitation],
          synchronize: true, // Only for dev
        };
      },
    }),
    DatabaseModule,
    UsersModule,
    FarmsModule,
    AuthModule,
  ],
})
export class AppModule {}
