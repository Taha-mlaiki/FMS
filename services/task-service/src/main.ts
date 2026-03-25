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
        protoPath: join(process.cwd(), '../../proto/task.proto'),
        package: 'task',
        url: '0.0.0.0:50053',
      },
    },
  );

  await app.listen();
  console.log('📋 task-service (gRPC) listening on port 50053');
}

void bootstrap();
