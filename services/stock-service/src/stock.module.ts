import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialEntity } from './materials/entities/material.entity';
import { TransactionEntity } from './transactions/entities/transaction.entity';
import { MaterialsService } from './materials/materials.service';
import { TransactionsService } from './transactions/transactions.service';
import { StockController } from './stock.controller';

@Module({
  imports: [
    // Registers entity metadata with the base DataSource so
    // TenantConnectionManager can replicate it into per-farm schemas.
    TypeOrmModule.forFeature([MaterialEntity, TransactionEntity]),
  ],
  controllers: [StockController],
  providers: [MaterialsService, TransactionsService],
  exports: [MaterialsService, TransactionsService],
})
export class StockModule {}
