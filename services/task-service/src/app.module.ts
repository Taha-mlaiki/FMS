import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { DatabaseModule } from '@shared/database';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_NAME') || 'FMS_task_service',
        schema: 'public',
        autoLoadEntities: true,
        // Multi-tenant: tables live in farm_<uuid> schemas, not public.
        // TenantConnectionManager handles synchronize per-schema.
        synchronize: false,
      }),
    }),
    DatabaseModule,
    TasksModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
