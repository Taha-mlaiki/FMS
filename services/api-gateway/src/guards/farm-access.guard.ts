import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FarmAccessService } from '../auth/farm-access.service';
import { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class FarmAccessGuard implements CanActivate {
  constructor(private readonly farmAccessService: FarmAccessService) {}

  private readFarmIdHeader(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (Array.isArray(value)) {
      const first = value.find(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0,
      );
      return first ?? null;
    }

    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return false; // JwtAuthGuard should have run first
    }

    // Extract farmId from route params, query, or body (for POST/PUT)
    const farmId =
      request.params.farmId ||
      request.query.farmId ||
      request.query.farm_id ||
      request.body?.farmId ||
      request.body?.farm_id ||
      this.readFarmIdHeader(request.headers?.['x-farm-id']);

    if (typeof farmId !== 'string' || !farmId) {
      return false; // farmId is required for farm-scoped endpoints
    }

    const membership = await this.farmAccessService.assertMembership(
      user.sub,
      farmId,
    );
    request.farmMembership = membership;

    return true;
  }
}
