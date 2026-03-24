import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { FarmsService } from '../farms/farms.service';
import { InvitationsService } from '../farms/invitations.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/entities/user.entity';
import { FarmRole } from '../farms/entities/user-farm.entity';

// Interface matching the gRPC RegisterRequest
// NOTE: gRPC/protobufjs auto-converts snake_case proto fields to camelCase in JS
export interface RegisterDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
}

// Interface matching the gRPC LoginRequest
export interface LoginDto {
  email?: string;
  phone?: string;
  password?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly farmsService: FarmsService,
    private readonly invitationsService: InvitationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user and automatically provision their first farm schema
   */
  async register(registerDto: RegisterDto) {
    this.logger.log(`Registering new user: ${registerDto.email}`);

    const normalizedRole =
      registerDto.role?.toUpperCase() === UserRole.WORKER
        ? UserRole.WORKER
        : UserRole.OWNER;

    // 1. Create the User (public schema)
    const user = await this.usersService.create(
      {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phoneNumber: registerDto.phone,
        role: normalizedRole,
      },
      registerDto.password,
    );

    // 2. Generate tokens without farm context (farm created in a later onboarding step)
    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user,
    };
  }

  async switchFarm(userId: string, farmId: string) {
    // Verify user belongs to this farm
    const farms = await this.farmsService.findByUserId(userId);
    const hasAccess = farms.some((f) => f.farm.id === farmId);

    if (!hasAccess) {
      throw new UnauthorizedException('auth.no_farm_access');
    }

    return this.generateTokens(userId, farmId);
  }

  async linkUserToFarm(
    userId: string,
    farmId: string,
    role = 'OWNER',
  ): Promise<void> {
    const normalizedRole = role?.toUpperCase();
    const resolvedRole =
      normalizedRole === FarmRole.ADMIN
        ? FarmRole.ADMIN
        : normalizedRole === FarmRole.WORKER
          ? FarmRole.WORKER
          : normalizedRole === FarmRole.CONSULTANT
            ? FarmRole.CONSULTANT
            : FarmRole.OWNER;

    await this.farmsService.linkUserToFarm(userId, farmId, resolvedRole);
  }

  /**
   * Authenticate a user and give them access to their primary farm
   */
  async login(loginDto: LoginDto) {
    const identifier = loginDto.email || loginDto.phone || '';
    this.logger.log(`Login attempt for user: ${identifier}`);

    // 1. Verify User (by email or phone)
    let user;
    if (loginDto.email) {
      user = await this.usersService.findByEmail(loginDto.email);
    } else if (loginDto.phone) {
      user = await this.usersService.findByPhone(loginDto.phone);
    }
    if (!user) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    // 2. Verify Password
    if (loginDto.password) {
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('auth.invalid_credentials');
      }
    }

    // 3. Get the user's farms to determine context
    const farms = await this.farmsService.getUserFarms(user.id);

    // Allow login without farm; onboarding can create/select farm afterwards
    const currentFarm = farms[0];
    const tokens = await this.generateTokens(user.id, currentFarm?.id);

    return {
      ...tokens,
      user,
      farm: currentFarm || undefined,
    };
  }

  /**
   * Generates a new access token (15m) and refresh token (7d)
   */
  public getUsersService() {
    return this.usersService;
  }
  public getFarmsService() {
    return this.farmsService;
  }

  async generateTokens(userId: string, farmId?: string) {
    const payload = farmId ? { sub: userId, farmId } : { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    // Store hash of refresh token in DB for validation
    await this.usersService.setCurrentRefreshToken(refreshToken, userId);

    return {
      accessToken,
      refreshToken,
      userId,
      farmId: farmId || null,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  /**
   * Refresh the access token using a valid refresh token
   */
  async refreshTokens(refreshToken: string) {
    try {
      // 1. Verify the token signature and expiration
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 2. Check DB to ensure token wasn't revoked and matches the hash
      const user = await this.usersService.getUserIfRefreshTokenMatches(
        refreshToken,
        payload.sub,
      );

      // 3. Generate new tokens (rotating the refresh token)
      return this.generateTokens(user.id, payload.farmId);
    } catch {
      throw new UnauthorizedException('auth.refresh_token_expired');
    }
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.usersService.removeRefreshToken(userId);
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const user = await this.usersService.findByEmail(email);
    return { available: !user };
  }

  async getInvitation(token: string): Promise<any> {
    return this.invitationsService.getInvitationByToken(token);
  }

  async acceptInvitationForUser(token: string, userId: string): Promise<any> {
    return this.invitationsService.acceptInvitationForExistingUser(
      token,
      userId,
    );
  }

  async listUserInvitations(userId: string): Promise<{ invitations: any[] }> {
    const user = await this.usersService.findById(userId);
    if (!user?.email) {
      throw new NotFoundException('auth.user_not_found');
    }

    const invitations =
      await this.invitationsService.listUserInvitationsByEmail(user.email);

    return { invitations };
  }

  async rejectInvitationForUser(token: string, userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.email) {
      throw new NotFoundException('auth.user_not_found');
    }

    return this.invitationsService.rejectInvitationForExistingUser(
      token,
      user.email,
    );
  }

  async inviteWorker(
    farmId: string,
    inviterId: string,
    email: string,
    role = 'WORKER',
  ): Promise<any> {
    const farms = await this.farmsService.findByUserId(inviterId);
    const inviterMembership = farms.find((item) => item.farm?.id === farmId);

    if (!inviterMembership) {
      throw new ForbiddenException('farm.no_access');
    }

    if (inviterMembership.role === 'WORKER') {
      throw new ForbiddenException('Workers cannot invite members');
    }

    const invitation = await this.invitationsService.createInvitation(
      farmId,
      inviterId,
      email,
      role,
    );

    return {
      id: invitation.id,
      email: invitation.email,
      farm_id: invitation.farmId,
      token: invitation.token,
      status: invitation.status,
      expires_at: invitation.expiresAt.toISOString(),
    };
  }

  async listFarmMembers(
    farmId: string,
    userId: string,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<any> {
    const farms = await this.farmsService.findByUserId(userId);
    const hasAccess = farms.some((item) => item.farm?.id === farmId);

    if (!hasAccess) {
      throw new ForbiddenException('farm.no_access');
    }

    const normalizedStatus = (() => {
      const raw = options?.status?.trim()?.toLowerCase();
      if (raw === 'pending' || raw === 'active' || raw === 'inactive') {
        return raw;
      }
      return undefined;
    })();

    return this.invitationsService.listWorkers(farmId, {
      page: options?.page,
      limit: options?.limit,
      status: normalizedStatus,
    });
  }

  async removeFarmMember(
    farmId: string,
    ownerId: string,
    memberId: string,
  ): Promise<{ success: boolean; message: string }> {
    const farms = await this.farmsService.findByUserId(ownerId);
    const requesterMembership = farms.find((item) => item.farm?.id === farmId);

    if (!requesterMembership) {
      throw new ForbiddenException('You do not have access to this farm');
    }

    if (requesterMembership.role === 'WORKER') {
      throw new ForbiddenException('auth.workers_cannot_remove');
    }

    await this.invitationsService.removeMember(farmId, memberId);
    return { success: true, message: 'Member removed successfully' };
  }
}
