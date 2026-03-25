import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserRole } from '../../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    avatarUrl: null,
    role: UserRole.OWNER,
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    userId: 'user-uuid-1',
    farmId: null,
    expiresIn: 900,
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      switchFarm: jest.fn(),
      linkUserToFarm: jest.fn(),
      revokeRefreshToken: jest.fn(),
      checkEmailAvailability: jest.fn(),
      getInvitation: jest.fn(),
      acceptInvitationForUser: jest.fn(),
      listUserInvitations: jest.fn(),
      rejectInvitationForUser: jest.fn(),
      inviteWorker: jest.fn(),
      listFarmMembers: jest.fn(),
      removeFarmMember: jest.fn(),
      getFarmsService: jest.fn(),
      getUsersService: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================
  // REGISTER
  // ===========================================================
  describe('register', () => {
    it('should register and return formatted gRPC response', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        ...mockTokens,
        user: mockUser as any,
      });

      const result = await controller.register({
        email: 'test@example.com',
        password: 'pass',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
        phone: mockUser.phoneNumber,
        avatar_url: mockUser.avatarUrl,
        role: mockUser.role,
      });
      expect(result.message).toContain('registered successfully');
    });

    it('should throw RpcException with ALREADY_EXISTS for duplicate email', async () => {
      const error = new ConflictException('auth.email_already_exists');
      (error as any).status = 409;
      (authService.register as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.register({
          email: 'dup@example.com',
          password: 'pass',
          firstName: 'A',
          lastName: 'B',
          role: 'OWNER',
        }),
      ).rejects.toThrow(RpcException);

      try {
        await controller.register({
          email: 'dup@example.com',
          password: 'pass',
          firstName: 'A',
          lastName: 'B',
          role: 'OWNER',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcException);
        const rpcError = (e as RpcException).getError() as any;
        expect(rpcError.code).toBe(GrpcStatus.ALREADY_EXISTS);
      }
    });

    it('should throw RpcException with INTERNAL for unknown errors', async () => {
      const error = new Error('DB connection failed');
      (error as any).status = 500;
      (authService.register as jest.Mock).mockRejectedValue(error);

      try {
        await controller.register({
          email: 'test@example.com',
          password: 'pass',
          firstName: 'A',
          lastName: 'B',
          role: 'OWNER',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcException);
        const rpcError = (e as RpcException).getError() as any;
        expect(rpcError.code).toBe(GrpcStatus.INTERNAL);
      }
    });
  });

  // ===========================================================
  // LOGIN
  // ===========================================================
  describe('login', () => {
    it('should login and return formatted gRPC response with farm', async () => {
      const mockFarm = {
        id: 'farm-1',
        name: 'My Farm',
        schemaName: 'farm_farm-1',
        status: 'active',
        createdAt: '2026-01-01',
      };

      (authService.login as jest.Mock).mockResolvedValue({
        ...mockTokens,
        user: mockUser as any,
        farm: mockFarm as any,
      });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'pass',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.message).toBe('Login successful');
      expect(result.user!.id).toBe(mockUser.id);
      expect(result.current_farm).toBeDefined();
      expect(result.current_farm!.id).toBe('farm-1');
    });

    it('should login without farm context', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        ...mockTokens,
        user: mockUser as any,
        farm: undefined,
      });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'pass',
      });

      expect(result.current_farm).toBeUndefined();
    });

    it('should throw RpcException with UNAUTHENTICATED for invalid credentials', async () => {
      const error = new UnauthorizedException('auth.invalid_credentials');
      (error as any).status = 401;
      (authService.login as jest.Mock).mockRejectedValue(error);

      try {
        await controller.login({ email: 'test@example.com', password: 'bad' });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcException);
        const rpcError = (e as RpcException).getError() as any;
        expect(rpcError.code).toBe(GrpcStatus.UNAUTHENTICATED);
      }
    });
  });

  // ===========================================================
  // REFRESH TOKEN
  // ===========================================================
  describe('refreshToken', () => {
    it('should refresh and return new tokens', async () => {
      (authService.refreshTokens as jest.Mock).mockResolvedValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        userId: 'uid',
        farmId: null,
        expiresIn: 900,
      });

      const result = await controller.refreshToken({
        refreshToken: 'valid-rt',
      });

      expect(result.accessToken).toBe('new-at');
      expect(result.refreshToken).toBe('new-rt');
      expect(result.message).toContain('refreshed');
    });

    it('should throw RpcException when refresh token is missing', async () => {
      await expect(
        controller.refreshToken({ refreshToken: '' }),
      ).rejects.toThrow(RpcException);
    });

    it('should throw UNAUTHENTICATED for expired refresh token', async () => {
      (authService.refreshTokens as jest.Mock).mockRejectedValue(
        new UnauthorizedException('expired'),
      );

      try {
        await controller.refreshToken({ refreshToken: 'expired-rt' });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcException);
        const rpcError = (e as RpcException).getError() as any;
        expect(rpcError.code).toBe(GrpcStatus.UNAUTHENTICATED);
      }
    });
  });

  // ===========================================================
  // SWITCH FARM
  // ===========================================================
  describe('switchFarm', () => {
    it('should switch farm and return new tokens', async () => {
      (authService.switchFarm as jest.Mock).mockResolvedValue({
        accessToken: 'farm-at',
        refreshToken: 'farm-rt',
        userId: 'uid',
        farmId: 'farm-2',
        expiresIn: 900,
      });

      const result = await controller.switchFarm({
        user_id: 'uid',
        farm_id: 'farm-2',
      });

      expect(result.accessToken).toBe('farm-at');
      expect(result.message).toContain('switched');
    });

    it('should throw PERMISSION_DENIED when user lacks access', async () => {
      (authService.switchFarm as jest.Mock).mockRejectedValue(
        new UnauthorizedException('no access'),
      );

      try {
        await controller.switchFarm({
          user_id: 'uid',
          farm_id: 'no-access',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcException);
        const rpcError = (e as RpcException).getError() as any;
        expect(rpcError.code).toBe(GrpcStatus.PERMISSION_DENIED);
      }
    });
  });

  // ===========================================================
  // REVOKE REFRESH TOKEN
  // ===========================================================
  describe('revokeRefreshToken', () => {
    it('should revoke and return success', async () => {
      (authService.revokeRefreshToken as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.revokeRefreshToken({
        user_id: 'uid',
      });

      expect(result.success).toBe(true);
    });

    it('should throw INVALID_ARGUMENT when user_id is missing', async () => {
      await expect(controller.revokeRefreshToken({})).rejects.toThrow(
        RpcException,
      );
    });
  });

  // ===========================================================
  // CHECK EMAIL AVAILABILITY
  // ===========================================================
  describe('checkEmailAvailability', () => {
    it('should return availability result', async () => {
      (authService.checkEmailAvailability as jest.Mock).mockResolvedValue({
        available: true,
      });

      const result = await controller.checkEmailAvailability({
        email: 'new@test.com',
      });

      expect(result.available).toBe(true);
    });
  });

  // ===========================================================
  // LINK USER TO FARM
  // ===========================================================
  describe('linkUserToFarm', () => {
    it('should link user to farm and return success', async () => {
      (authService.linkUserToFarm as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.linkUserToFarm({
        user_id: 'uid',
        farm_id: 'fid',
        role: 'OWNER',
      });

      expect(result.success).toBe(true);
    });

    it('should accept both camelCase and snake_case params', async () => {
      (authService.linkUserToFarm as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.linkUserToFarm({
        userId: 'uid',
        farmId: 'fid',
      });

      expect(result.success).toBe(true);
      expect(authService.linkUserToFarm).toHaveBeenCalledWith(
        'uid',
        'fid',
        undefined,
      );
    });
  });
});
