import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.TASKS_GRPC_URL || 'localhost:50053',
          package: 'task',
          protoPath: join(process.cwd(), '../../proto/task.proto'),
        },
      },
      {
        name: 'REPORTS_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.REPORTS_GRPC_URL || 'localhost:50056',
          package: 'report',
          protoPath: join(process.cwd(), '../../proto/report.proto'),
        },
      },
      {
        name: 'STOCK_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.STOCK_GRPC_URL || 'localhost:50055',
          package: 'stock',
          protoPath: join(process.cwd(), '../../proto/stock.proto'),
        },
      },
    ]),
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
