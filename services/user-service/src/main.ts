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
        protoPath: join(process.cwd(), '../../proto/user.proto'),
        package: 'user',
        url: '0.0.0.0:50051',
      },
    },
  );

  await app.listen();
  console.log('👤 User Service (gRPC) listening on port 50051');
}

void bootstrap();
