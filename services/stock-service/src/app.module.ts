import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { DatabaseModule } from '@shared/database';
import { StockModule } from './stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'services/stock-service/.env'),
        join(process.cwd(), '.env'),
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || '123456789',
        database: configService.get<string>('DB_NAME') || 'FMS_stock_service',
        schema: 'public',
        autoLoadEntities: true,
        // Multi-tenant: tables live in farm_<uuid> schemas, not public.
        // TenantConnectionManager handles synchronize per-schema.
        synchronize: false,
      }),
    }),
    DatabaseModule,
    StockModule,
  ],
})
export class AppModule {}
