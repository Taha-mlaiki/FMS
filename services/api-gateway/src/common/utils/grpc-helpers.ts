import { Metadata } from '@grpc/grpc-js';
import { JwtPayload } from '../../guards/jwt-auth.guard';

export function createGrpcMetadata(
  user: JwtPayload,
  farmId?: string,
  role?: string,
): Metadata {
  const metadata = new Metadata();
  metadata.add('user-id', user.sub);
  metadata.add('user-email', user.email);

  if (role) {
    metadata.add('user-role', role);
  }

  const activeFarmId = farmId || user.farmId;
  if (activeFarmId) {
    metadata.add('farm-id', activeFarmId);
  }

  return metadata;
}
