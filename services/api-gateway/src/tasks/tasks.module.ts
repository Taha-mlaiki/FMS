import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { FarmTasksController } from './farm-tasks.controller';
import { FarmTaskTemplatesController } from './farm-task-templates.controller';
import { FarmTaskCategoriesController } from './farm-task-categories.controller';

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
          loader: { keepCase: true },
        },
      },
      {
        name: 'REPORTS_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.REPORTS_GRPC_URL || 'localhost:50056',
          package: 'report',
          protoPath: join(process.cwd(), '../../proto/report.proto'),
          loader: { keepCase: true },
        },
      },
      {
        name: 'STOCK_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.STOCK_GRPC_URL || 'localhost:50055',
          package: 'stock',
          protoPath: join(process.cwd(), '../../proto/stock.proto'),
          loader: { keepCase: true },
        },
      },
      {
        name: 'PRODUCTION_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCTION_GRPC_URL || 'localhost:50054',
          package: 'production',
          protoPath: join(process.cwd(), '../../proto/production.proto'),
          loader: { keepCase: true },
        },
      },
    ]),
  ],
  controllers: [
    FarmTasksController,
    FarmTaskTemplatesController,
    FarmTaskCategoriesController,
  ],
})
export class TasksModule {}
