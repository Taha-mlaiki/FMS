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
        protoPath: join(process.cwd(), '../../proto/farm.proto'),
        package: 'farm',
        url: '0.0.0.0:50052',
      },
    },
  );

  await app.listen();
  console.log('🚜 Farm Service (gRPC) listening on port 50052');
}

bootstrap();
