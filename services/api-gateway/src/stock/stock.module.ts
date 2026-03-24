import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { StockController } from './stock.controller';
import { FarmStockController } from './farm-stock.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'STOCK_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.STOCK_GRPC_URL || 'localhost:50055',
          package: 'stock',
          protoPath: join(process.cwd(), '../../proto/stock.proto'),
          keepCase: true,
        },
      },
    ]),
  ],
  controllers: [StockController, FarmStockController],
})
export class StockModule {}
