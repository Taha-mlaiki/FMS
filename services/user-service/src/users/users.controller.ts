import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { status } from '@grpc/grpc-js';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private resolveUserId(data: { user_id?: string; userId?: string }): string {
    return data.user_id ?? data.userId ?? '';
  }

  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(data: { user_id?: string; userId?: string }) {
    const userId = this.resolveUserId(data);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }
    return {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phoneNumber,
      avatar_url: user.avatarUrl,
      role: user.role,
      created_at: user.createdAt.toISOString(),
    };
  }

  @GrpcMethod('UserService', 'UpdateProfile')
  async updateProfile(data: any) {
    const userId = this.resolveUserId(data);
    const updated = await this.usersService.updateProfile(userId, {
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumber: data.phone,
      avatarUrl: data.avatar_url,
    });
    return {
      id: updated.id,
      email: updated.email,
      first_name: updated.firstName,
      last_name: updated.lastName,
      phone: updated.phoneNumber,
      avatar_url: updated.avatarUrl,
      role: updated.role,
      created_at: updated.createdAt.toISOString(),
    };
  }

  @GrpcMethod('UserService', 'ChangePassword')
  async changePassword(data: any) {
    try {
      const userId = this.resolveUserId(data);
      await this.usersService.changePassword(
        userId,
        data.current_password,
        data.new_password,
      );
      return { success: true, message: 'Password changed successfully' };
    } catch (e) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: e.message,
      });
    }
  }

  @GrpcMethod('UserService', 'HealthCheck')
  healthCheck() {
    return { status: 'OK', service: 'User Service' };
  }
}
