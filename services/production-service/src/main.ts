import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        protoPath: join(process.cwd(), '../../proto/production.proto'),
        package: 'production',
        url: '0.0.0.0:50054',
      },
    },
  );

  await app.listen();
  console.log('🐔 production-service (gRPC) listening on port 50054');
}

void bootstrap();
