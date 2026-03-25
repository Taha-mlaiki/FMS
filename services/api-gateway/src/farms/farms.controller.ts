import {
  UnauthorizedException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { FarmAccessService } from '../auth/farm-access.service';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { CreateFarmDto } from './dto/create-farm.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { FarmsService } from './farms.service';

type FarmPayload = {
  address?: string;
  location?: string;
};

function normalizeFarmPayload(farm: FarmPayload): FarmPayload {
  const location =
    typeof farm.location === 'string'
      ? farm.location
      : typeof farm.address === 'string'
        ? farm.address
        : undefined;

  return {
    ...farm,
    location,
    address:
      typeof farm.address === 'string'
        ? farm.address
        : typeof location === 'string'
          ? location
          : undefined,
  };
}

@ApiTags('Farms')
@ApiBearerAuth('bearer')
@Controller('farms')
export class FarmsController {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly authService: AuthService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List farms for current user',
    description: 'Returns all farms the authenticated user belongs to.',
  })
  async listFarms(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const farms = await this.authService.listUserFarms(userId, {
      suppressErrors: false,
    });
    const memberships = Array.isArray(farms) ? farms : [];

    return memberships.map((membership) => ({
      id: membership.farm?.id,
      name: membership.farm?.name,
      location: membership.farm?.location,
      address: membership.farm?.address,
      schemaName: membership.farm?.schemaName,
      status: membership.farm?.status,
      createdAt: membership.farm?.createdAt,
      role: membership.role,
    }));
  }

  @Get('owned')
  @ApiOperation({
    summary: 'List farms owned by current user',
    description: 'Returns farms where the authenticated user has OWNER role.',
  })
  async listOwnedFarms(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const farms = await this.authService.listOwnedFarms(userId, {
      suppressErrors: false,
    });

    return farms.map((membership) => ({
      id: membership.farm?.id,
      name: membership.farm?.name,
      location: membership.farm?.location,
      address: membership.farm?.address,
      schemaName: membership.farm?.schemaName,
      status: membership.farm?.status,
      createdAt: membership.farm?.createdAt,
      role: membership.role,
    }));
  }

  @Post()
  @ApiOperation({
    summary: 'Create a farm',
    description:
      'Creates a farm via farm-service. Intended for onboarding after user registration.',
  })
  @ApiResponse({ status: 201, description: 'Farm created successfully.' })
  async createFarm(
    @Body() dto: CreateFarmDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const metadata = createGrpcMetadata(req.user, undefined, 'OWNER');
    const farm = await this.farmsService.createFarm(dto, metadata);
    await this.authService.linkUserToFarm(userId, farm.id, 'OWNER');

    return {
      message: 'Farm created successfully',
      farm,
      createdByUserId: userId,
    };
  }

  @Get(':farmId')
  @ApiOperation({
    summary: 'Get farm details',
    description: 'Returns detailed information for the selected farm.',
  })
  async getFarmDetails(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.farmAccessService.assertMembership(req.user.sub, farmId);
    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const farm = await this.farmsService.getFarm(farmId, metadata);
    return normalizeFarmPayload(farm as unknown as FarmPayload);
  }

  @Patch(':farmId')
  @ApiOperation({
    summary: 'Update farm details',
    description: 'Updates basic farm data like name and location.',
  })
  async updateFarm(
    @Param('farmId') farmId: string,
    @Body() dto: UpdateFarmDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const membership = await this.farmAccessService.assertMembership(
      req.user.sub,
      farmId,
    );

    if (membership.role === 'WORKER') {
      throw new ForbiddenException('Only managers can update farm settings');
    }

    const metadata = createGrpcMetadata(
      req.user,
      farmId,
      req.farmMembership?.role,
    );
    const updatedFarm = await this.farmsService.updateFarm(
      farmId,
      {
        name: dto.name,
        address: dto.location ?? dto.address,
        type: dto.type,
      },
      metadata,
    );

    return normalizeFarmPayload(updatedFarm as unknown as FarmPayload);
  }

  @Get(':farmId/members')
  @ApiOperation({
    summary: 'List farm members',
    description: 'Returns all members assigned to the selected farm.',
  })
  async listFarmMembers(
    @Param('farmId') farmId: string,
    @Query() query: ListMembersQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.farmAccessService.assertMembership(req.user.sub, farmId);
    const members = await this.authService.listFarmMembers(
      farmId,
      req.user.sub,
      {
        page: query.page,
        limit: query.limit,
        status: query.status,
      },
    );

    return members;
  }

  @Post(':farmId/invite')
  @ApiOperation({
    summary: 'Invite a member to a farm',
    description: 'Creates an invitation token for a new member.',
  })
  async inviteMember(
    @Param('farmId') farmId: string,
    @Body() dto: InviteMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const membership = await this.farmAccessService.assertMembership(
      req.user.sub,
      farmId,
    );

    if (membership.role === 'WORKER') {
      throw new ForbiddenException('Only managers can invite members');
    }

    return this.authService.inviteWorker(
      farmId,
      req.user.sub,
      dto.email,
      dto.role ?? 'WORKER',
    );
  }

  @Patch(':farmId/members/:memberId')
  @ApiOperation({
    summary: 'Update farm member status',
    description: 'Supports member deactivation for settings management.',
  })
  async updateFarmMember(
    @Param('farmId') farmId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const membership = await this.farmAccessService.assertMembership(
      req.user.sub,
      farmId,
    );

    if (membership.role === 'WORKER') {
      throw new ForbiddenException('Only managers can manage members');
    }

    const isInactive = dto.status === 'inactive' || dto.isActive === false;
    if (!isInactive) {
      throw new BadRequestException(
        'Only deactivation is supported by this endpoint',
      );
    }

    return this.authService.removeFarmMember(farmId, req.user.sub, memberId);
  }
}
