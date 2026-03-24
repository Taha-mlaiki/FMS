// ================================================================
// Auth Module — Gateway Side (gRPC CLIENT + JWT verification)
// ================================================================
// This module does TWO things:
//   1. Registers a gRPC client to forward auth requests to auth-service
//   2. Registers JwtModule so the gateway can VERIFY tokens locally
//      (for the Auth Guard to check incoming requests)
// ================================================================

import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { join } from 'path';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FarmAccessService } from './farm-access.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.USER_GRPC_URL || 'localhost:50051',
          package: 'user',
          protoPath: join(
            process.cwd(),
            process.env.PROTO_PATH || '../../proto',
            'user.proto',
          ),
        },
      },
    ]),

    // -------------------------------------------------------
    // JwtModule — for VERIFYING tokens on the gateway
    // -------------------------------------------------------
    // The auth-service CREATES tokens (signs them).
    // The gateway VERIFIES tokens (checks the signature).
    // Both must use the SAME secret key.
    //
    // This is why the JWT_SECRET env var is shared between
    // both services in docker-compose.yml.
    // -------------------------------------------------------
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, FarmAccessService],
  exports: [JwtModule, JwtAuthGuard, AuthService, FarmAccessService],
})
export class AuthModule {}
