import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'REPORTS_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.REPORTS_GRPC_URL || 'localhost:50056',
          package: 'report',
          protoPath: join(process.cwd(), '../../proto/report.proto'),
        },
      },
    ]),
  ],
  controllers: [ReportsController],
})
export class ReportsModule {}
