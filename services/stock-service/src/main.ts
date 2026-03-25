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
        protoPath: join(process.cwd(), '../../proto/stock.proto'),
        package: 'stock',
        url: '0.0.0.0:50055',
      },
    },
  );

  await app.listen();
  console.log('📦 stock-service (gRPC) listening on port 50055');
}

void bootstrap();
