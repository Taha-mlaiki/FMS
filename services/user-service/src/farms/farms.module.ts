import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FarmsService } from './farms.service';
import { InvitationsService } from './invitations.service';
import { UserFarm } from './entities/user-farm.entity';
import { Invitation } from './entities/invitation.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFarm, Invitation]),
    UsersModule,
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
  controllers: [],
  providers: [FarmsService, InvitationsService],
  exports: [FarmsService, InvitationsService],
})
export class FarmsModule {}
