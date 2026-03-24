import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService, FarmMembership } from './auth.service';

@Injectable()
export class FarmAccessService {
  constructor(private readonly authService: AuthService) {}

  private extractFarmId(membership: FarmMembership): string | null {
    const directFarmId = membership.farm?.id;
    if (typeof directFarmId === 'string' && directFarmId.length > 0) {
      return directFarmId;
    }

    const fallback = membership as FarmMembership & {
      farmId?: string;
      farm_id?: string;
    };

    if (typeof fallback.farmId === 'string' && fallback.farmId.length > 0) {
      return fallback.farmId;
    }

    if (typeof fallback.farm_id === 'string' && fallback.farm_id.length > 0) {
      return fallback.farm_id;
    }

    return null;
  }

  async assertMembership(
    userId: string,
    farmId: string,
  ): Promise<FarmMembership> {
    const farms = await this.authService.listUserFarms(userId, {
      suppressErrors: false,
    });
    if (!Array.isArray(farms)) {
      throw new ForbiddenException('farm.unable_to_verify_access');
    }
    const requestedFarmId = farmId.trim();
    const membership = farms.find(
      (item) => this.extractFarmId(item) === requestedFarmId,
    );

    if (!membership) {
      throw new ForbiddenException('farm.no_access');
    }

    return membership;
  }

  async assertOwnership(
    userId: string,
    farmId: string,
  ): Promise<FarmMembership> {
    const farms = await this.authService.listOwnedFarms(userId, {
      suppressErrors: false,
    });

    if (!Array.isArray(farms)) {
      throw new ForbiddenException('farm.unable_to_verify_ownership');
    }

    const requestedFarmId = farmId.trim();
    const membership = farms.find(
      (item) => this.extractFarmId(item) === requestedFarmId,
    );

    if (!membership) {
      throw new ForbiddenException('farm.only_owners_can_update');
    }

    return membership;
  }
}
