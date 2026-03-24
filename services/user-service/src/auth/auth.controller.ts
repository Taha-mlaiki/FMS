import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { AuthService, RegisterDto, LoginDto } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('UserService', 'Register')
  async register(data: RegisterDto) {
    try {
      const result = await this.authService.register(data);

      return {
        message:
          'User registered successfully. Create your farm to continue setup.',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
              first_name: result.user.firstName,
              last_name: result.user.lastName,
              phone: result.user.phoneNumber,
              avatar_url: result.user.avatarUrl,
              role: result.user.role,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Register failed: ${error.message}`);
      throw new RpcException({
        code:
          error.status === 409
            ? GrpcStatus.ALREADY_EXISTS
            : GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'Login')
  async login(data: LoginDto) {
    try {
      const result = await this.authService.login(data);

      return {
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
              first_name: result.user.firstName,
              last_name: result.user.lastName,
              phone: result.user.phoneNumber,
              avatar_url: result.user.avatarUrl,
              role: result.user.role,
            }
          : undefined,
        current_farm: result.farm
          ? {
              id: result.farm.id,
              name: result.farm.name,
              schema_name: result.farm.schemaName,
              status: result.farm.status,
              created_at: result.farm.createdAt,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new RpcException({
        code:
          error.status === 401
            ? GrpcStatus.UNAUTHENTICATED
            : GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'RefreshToken')
  async refreshToken(data: { refreshToken: string }) {
    try {
      if (!data.refreshToken) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'Refresh token is required',
        });
      }

      const result = await this.authService.refreshTokens(data.refreshToken);
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        // expiresIn: result.expiresIn.toString(), // Not in proto AuthResponse
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`);
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'SwitchFarm')
  async switchFarm(data: { user_id: string; farm_id: string }) {
    try {
      const result = await this.authService.switchFarm(
        data.user_id,
        data.farm_id,
      );
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        message: 'Context switched successfully',
      };
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.PERMISSION_DENIED,
        message: error.message,
      });
    }
  }

  @GrpcMethod('UserService', 'LinkUserToFarm')
  async linkUserToFarm(data: {
    user_id?: string;
    userId?: string;
    farm_id?: string;
    farmId?: string;
    role?: string;
  }) {
    const userId = data.user_id ?? data.userId ?? '';
    const farmId = data.farm_id ?? data.farmId ?? '';

    await this.authService.linkUserToFarm(userId, farmId, data.role);
    return { success: true, message: 'User linked to farm' };
  }

  @GrpcMethod('UserService', 'RevokeRefreshToken')
  async revokeRefreshToken(data: { user_id?: string; userId?: string }) {
    const userId = data.user_id ?? data.userId;
    if (!userId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'User ID is required',
      });
    }

    await this.authService.revokeRefreshToken(userId);
    return { success: true, message: 'Refresh token revoked' };
  }

  @GrpcMethod('UserService', 'CheckEmailAvailability')
  async checkEmailAvailability(data: { email: string }) {
    return this.authService.checkEmailAvailability(data.email);
  }

  @GrpcMethod('UserService', 'ListFarms')
  async listFarms(data: {
    user_id?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const userId = data.user_id ?? data.userId ?? '';
      const page = data.page || 1;
      const limit = data.limit || 1000;

      const farmsWithRoles = await this.authService
        .getFarmsService()
        .findByUserId(userId);

      const total = farmsWithRoles.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paged = farmsWithRoles.slice(start, end);

      return {
        farms: paged.map((item) => ({
          farm: item.farm
            ? {
                id: item.farm.id,
                name: item.farm.name,
                address: item.farm.address,
                type: item.farm.type,
                owner_id: '',
                schema_name: item.farm.schemaName,
                status: item.farm.status,
                created_at: item.farm.createdAt,
              }
            : undefined,
          role: item.role,
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`ListFarms failed: ${err.message}`);
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: err.message,
      });
    }
  }

  @GrpcMethod('UserService', 'ListOwnerFarms')
  async listOwnerFarms(data: {
    user_id?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const userId = data.user_id ?? data.userId ?? '';
      const page = data.page || 1;
      const limit = data.limit || 1000;

      const farmsWithRoles = await this.authService
        .getFarmsService()
        .findOwnedByUserId(userId);

      const total = farmsWithRoles.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paged = farmsWithRoles.slice(start, end);

      return {
        farms: paged.map((item) => ({
          farm: item.farm
            ? {
                id: item.farm.id,
                name: item.farm.name,
                address: item.farm.address,
                type: item.farm.type,
                owner_id: '',
                schema_name: item.farm.schemaName,
                status: item.farm.status,
                created_at: item.farm.createdAt,
              }
            : undefined,
          role: item.role,
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`ListOwnerFarms failed: ${err.message}`);
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: err.message,
      });
    }
  }

  @GrpcMethod('UserService', 'GetInvitation')
  async getInvitation(data: { token: string }) {
    try {
      return await this.authService.getInvitation(data.token);
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      let code = GrpcStatus.INTERNAL;
      if (err.status === 400) code = GrpcStatus.INVALID_ARGUMENT;
      else if (err.status === 403) code = GrpcStatus.PERMISSION_DENIED;
      else if (err.status === 404) code = GrpcStatus.NOT_FOUND;

      throw new RpcException({
        code,
        message: err.message ?? 'Failed to get invitation',
      });
    }
  }

  @GrpcMethod('UserService', 'AcceptInvitationForUser')
  async acceptInvitationForUser(data: {
    token?: string;
    user_id?: string;
    userId?: string;
  }) {
    try {
      const token = data.token ?? '';
      const userId = data.user_id ?? data.userId ?? '';

      if (!token || !userId) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'token and user_id are required',
        });
      }

      return await this.authService.acceptInvitationForUser(token, userId);
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      let code = GrpcStatus.INTERNAL;
      if (err.status === 400) code = GrpcStatus.INVALID_ARGUMENT;
      else if (err.status === 403) code = GrpcStatus.PERMISSION_DENIED;
      else if (err.status === 404) code = GrpcStatus.NOT_FOUND;

      throw new RpcException({
        code,
        message: err.message ?? 'Failed to accept invitation',
      });
    }
  }

  @GrpcMethod('UserService', 'ListUserInvitations')
  async listUserInvitations(data: { user_id?: string; userId?: string }) {
    try {
      const userId = data.user_id ?? data.userId ?? '';
      if (!userId) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'user_id is required',
        });
      }

      return await this.authService.listUserInvitations(userId);
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code:
          err.status === 400
            ? GrpcStatus.INVALID_ARGUMENT
            : err.status === 403
              ? GrpcStatus.PERMISSION_DENIED
              : err.status === 404
                ? GrpcStatus.NOT_FOUND
                : GrpcStatus.INTERNAL,
        message: err.message ?? 'Unable to list invitations',
      });
    }
  }

  @GrpcMethod('UserService', 'RejectInvitationForUser')
  async rejectInvitationForUser(data: {
    token?: string;
    user_id?: string;
    userId?: string;
  }) {
    try {
      const token = data.token ?? '';
      const userId = data.user_id ?? data.userId ?? '';

      if (!token || !userId) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'token and user_id are required',
        });
      }

      return await this.authService.rejectInvitationForUser(token, userId);
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code:
          err.status === 400
            ? GrpcStatus.INVALID_ARGUMENT
            : err.status === 403
              ? GrpcStatus.PERMISSION_DENIED
              : err.status === 404
                ? GrpcStatus.NOT_FOUND
                : GrpcStatus.INTERNAL,
        message: err.message ?? 'Unable to reject invitation',
      });
    }
  }

  @GrpcMethod('UserService', 'InviteWorker')
  async inviteWorker(data: {
    farm_id?: string;
    farmId?: string;
    inviter_id?: string;
    inviterId?: string;
    email: string;
    role?: string;
  }) {
    try {
      const farmId = data.farm_id ?? data.farmId ?? '';
      const inviterId = data.inviter_id ?? data.inviterId ?? '';

      if (!farmId || !inviterId || !data.email) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'farm_id, inviter_id and email are required',
        });
      }

      return await this.authService.inviteWorker(
        farmId,
        inviterId,
        data.email,
        data.role,
      );
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code:
          err.status === 400
            ? GrpcStatus.INVALID_ARGUMENT
            : err.status === 403
              ? GrpcStatus.PERMISSION_DENIED
              : err.status === 404
                ? GrpcStatus.NOT_FOUND
                : GrpcStatus.INTERNAL,
        message: err.message ?? 'Unable to invite worker',
      });
    }
  }

  @GrpcMethod('UserService', 'ListFarmMembers')
  async listFarmMembers(data: {
    farm_id?: string;
    farmId?: string;
    user_id?: string;
    userId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const farmId = data.farm_id ?? data.farmId ?? '';
      const userId = data.user_id ?? data.userId ?? '';

      if (!farmId || !userId) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'farm_id and user_id are required',
        });
      }

      return await this.authService.listFarmMembers(farmId, userId, {
        page: data.page,
        limit: data.limit,
        status: data.status,
      });
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code:
          err.status === 400
            ? GrpcStatus.INVALID_ARGUMENT
            : err.status === 403
              ? GrpcStatus.PERMISSION_DENIED
              : err.status === 404
                ? GrpcStatus.NOT_FOUND
                : GrpcStatus.INTERNAL,
        message: err.message ?? 'Unable to list farm members',
      });
    }
  }

  @GrpcMethod('UserService', 'RemoveFarmMember')
  async removeFarmMember(data: {
    farm_id?: string;
    farmId?: string;
    owner_id?: string;
    ownerId?: string;
    member_id?: string;
    memberId?: string;
  }) {
    try {
      const farmId = data.farm_id ?? data.farmId ?? '';
      const ownerId = data.owner_id ?? data.ownerId ?? '';
      const memberId = data.member_id ?? data.memberId ?? '';

      if (!farmId || !ownerId || !memberId) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          message: 'farm_id, owner_id and member_id are required',
        });
      }

      return await this.authService.removeFarmMember(farmId, ownerId, memberId);
    } catch (error) {
      const err = error as { message?: string; status?: number };
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code:
          err.status === 400
            ? GrpcStatus.INVALID_ARGUMENT
            : err.status === 403
              ? GrpcStatus.PERMISSION_DENIED
              : err.status === 404
                ? GrpcStatus.NOT_FOUND
                : GrpcStatus.INTERNAL,
        message: err.message ?? 'Unable to remove farm member',
      });
    }
  }
}
