import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@shared/database';
import { AnimalGroup } from './groups/entities/group.entity';
import { MetricTypeEntity } from './tracking/entities/metric-type.entity';
import { MetricRecordEntity } from './tracking/entities/metric-record.entity';
import { MortalityRecordEntity } from './tracking/entities/mortality-record.entity';
import { GroupsService } from './groups/groups.service';
import { TrackingService } from './tracking/tracking.service';
import { ProductionController } from './production.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnimalGroup,
      MetricTypeEntity,
      MetricRecordEntity,
      MortalityRecordEntity,
    ]),
    DatabaseModule,
  ],
  controllers: [ProductionController],
  providers: [GroupsService, TrackingService],
  exports: [GroupsService, TrackingService],
})
export class ProductionModule {}
