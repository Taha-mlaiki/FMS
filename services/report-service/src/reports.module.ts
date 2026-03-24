import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './reports/entities/report.entity';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    // Registers entity metadata with the base DataSource so
    // TenantConnectionManager can replicate it into per-farm schemas.
    TypeOrmModule.forFeature([ReportEntity]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
