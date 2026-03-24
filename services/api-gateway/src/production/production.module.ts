import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { ProductionController } from './production.controller';
import { FarmProductionController } from './farm-production.controller';
import { FarmMetricTypesController } from './farm-metric-types.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCTION_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCTION_GRPC_URL || 'localhost:50054',
          package: 'production',
          protoPath: join(process.cwd(), '../../proto/production.proto'),
          keepCase: true,
        },
      },
    ]),
  ],
  controllers: [
    ProductionController,
    FarmProductionController,
    FarmMetricTypesController,
  ],
})
export class ProductionModule {}
