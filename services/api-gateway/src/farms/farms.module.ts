import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FARM_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.FARM_GRPC_URL || 'localhost:50052',
          package: 'farm',
          protoPath: join(process.cwd(), '../../proto/farm.proto'),
        },
      },
    ]),
  ],
  controllers: [FarmsController],
  providers: [FarmsService],
})
export class FarmsModule {}
