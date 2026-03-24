import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService, RegisterDto, LoginDto } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { FarmsService } from '../../farms/farms.service';
import { InvitationsService } from '../../farms/invitations.service';
import { UserRole } from '../../users/entities/user.entity';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let farmsService: jest.Mocked<Partial<FarmsService>>;
  let invitationsService: jest.Mocked<Partial<InvitationsService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.OWNER,
    phoneNumber: '+1234567890',
    avatarUrl: null,
    isActive: true,
    currentHashedRefreshToken: null,
    memberships: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFarm = {
    id: 'farm-uuid-1',
    name: 'Test Farm',
    schemaName: 'farm_farm-uuid-1',
    status: 'active',
    createdAt: '2026-01-01',
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      setCurrentRefreshToken: jest.fn(),
      getUserIfRefreshTokenMatches: jest.fn(),
      removeRefreshToken: jest.fn(),
    };

    farmsService = {
      findByUserId: jest.fn(),
      getUserFarms: jest.fn(),
      linkUserToFarm: jest.fn(),
      findOwnedByUserId: jest.fn(),
    };

    invitationsService = {
      getInvitationByToken: jest.fn(),
      acceptInvitationForExistingUser: jest.fn(),
      listUserInvitationsByEmail: jest.fn(),
      rejectInvitationForExistingUser: jest.fn(),
      createInvitation: jest.fn(),
      listWorkers: jest.fn(),
      removeMember: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: FarmsService, useValue: farmsService },
        { provide: InvitationsService, useValue: invitationsService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================
  // REGISTRATION
  // ===========================================================
  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'OWNER',
    };

    it('should register a new user and return tokens', async () => {
      const createdUser = { ...mockUser, email: registerDto.email };
      usersService.create!.mockResolvedValue(createdUser as any);
      jwtService.signAsync!
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        {
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phoneNumber: undefined,
          role: UserRole.OWNER,
        },
        registerDto.password,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toBeDefined();
    });

    it('should register a WORKER role when specified', async () => {
      const workerDto: RegisterDto = { ...registerDto, role: 'WORKER' };
      const createdWorker = { ...mockUser, role: UserRole.WORKER };
      usersService.create!.mockResolvedValue(createdWorker as any);
      jwtService.signAsync!
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      await authService.register(workerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.WORKER }),
        workerDto.password,
      );
    });

    it('should default to OWNER role for unrecognized roles', async () => {
      const unknownRoleDto: RegisterDto = { ...registerDto, role: 'UNKNOWN' };
      usersService.create!.mockResolvedValue(mockUser as any);
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      await authService.register(unknownRoleDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.OWNER }),
        unknownRoleDto.password,
      );
    });

    it('should propagate ConflictException for duplicate email', async () => {
      usersService.create!.mockRejectedValue(
        new ConflictException('auth.email_already_exists'),
      );

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should include phone number when provided', async () => {
      const dtoWithPhone: RegisterDto = { ...registerDto, phone: '+9876543210' };
      usersService.create!.mockResolvedValue(mockUser as any);
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      await authService.register(dtoWithPhone);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ phoneNumber: '+9876543210' }),
        dtoWithPhone.password,
      );
    });
  });

  // ===========================================================
  // LOGIN
  // ===========================================================
  describe('login', () => {
    it('should login with valid email and password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'CorrectPass',
      };

      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      farmsService.getUserFarms!.mockResolvedValue([mockFarm as any]);
      jwtService.signAsync!
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should login with phone number', async () => {
      const loginDto: LoginDto = {
        phone: '+1234567890',
        password: 'CorrectPass',
      };

      usersService.findByPhone!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      farmsService.getUserFarms!.mockResolvedValue([]);
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.login(loginDto);

      expect(usersService.findByPhone).toHaveBeenCalledWith(loginDto.phone);
      expect(result.accessToken).toBe('at');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should login successfully without farm context', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      farmsService.getUserFarms!.mockResolvedValue([]);
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'CorrectPass',
      });

      expect(result.farm).toBeUndefined();
      expect(result.accessToken).toBe('at');
    });

    it('should include farm context when user has farms', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      farmsService.getUserFarms!.mockResolvedValue([mockFarm as any]);
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'CorrectPass',
      });

      expect(result.farm).toEqual(mockFarm);
    });
  });

  // ===========================================================
  // TOKEN GENERATION
  // ===========================================================
  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      jwtService.signAsync!
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.generateTokens('user-id');

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-id' },
        { secret: 'test-jwt-secret', expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-id' },
        { secret: 'test-jwt-secret', expiresIn: '7d' },
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(900);
    });

    it('should include farmId in JWT payload when provided', async () => {
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.generateTokens('user-id', 'farm-id');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-id', farmId: 'farm-id' },
        expect.any(Object),
      );
      expect(result.farmId).toBe('farm-id');
    });

    it('should set farmId to null when no farm provided', async () => {
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.generateTokens('user-id');

      expect(result.farmId).toBeNull();
    });

    it('should store hashed refresh token in DB', async () => {
      jwtService.signAsync!
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('refresh-token');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      await authService.generateTokens('user-id');

      expect(usersService.setCurrentRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
        'user-id',
      );
    });
  });

  // ===========================================================
  // TOKEN REFRESH
  // ===========================================================
  describe('refreshTokens', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      jwtService.verifyAsync!.mockResolvedValue({
        sub: 'user-id',
        farmId: 'farm-id',
      });
      usersService.getUserIfRefreshTokenMatches!.mockResolvedValue(
        mockUser as any,
      );
      jwtService.signAsync!
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'test-jwt-secret' },
      );
      expect(
        usersService.getUserIfRefreshTokenMatches,
      ).toHaveBeenCalledWith('valid-refresh-token', 'user-id');
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      jwtService.verifyAsync!.mockRejectedValue(new Error('jwt expired'));

      await expect(
        authService.refreshTokens('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verifyAsync!.mockRejectedValue(
        new Error('invalid signature'),
      );

      await expect(
        authService.refreshTokens('tampered-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token does not match DB hash', async () => {
      jwtService.verifyAsync!.mockResolvedValue({ sub: 'user-id' });
      usersService.getUserIfRefreshTokenMatches!.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(
        authService.refreshTokens('mismatched-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================
  // TOKEN REVOCATION
  // ===========================================================
  describe('revokeRefreshToken', () => {
    it('should revoke the refresh token for a user', async () => {
      usersService.removeRefreshToken!.mockResolvedValue(undefined as any);

      await authService.revokeRefreshToken('user-id');

      expect(usersService.removeRefreshToken).toHaveBeenCalledWith('user-id');
    });
  });

  // ===========================================================
  // SWITCH FARM
  // ===========================================================
  describe('switchFarm', () => {
    it('should switch farm context and return new tokens', async () => {
      farmsService.findByUserId!.mockResolvedValue([
        { farm: { id: 'farm-1' }, role: 'OWNER' },
      ]);
      jwtService.signAsync!
        .mockResolvedValueOnce('new-at')
        .mockResolvedValueOnce('new-rt');
      usersService.setCurrentRefreshToken!.mockResolvedValue(undefined);

      const result = await authService.switchFarm('user-id', 'farm-1');

      expect(result.accessToken).toBe('new-at');
      expect(result.farmId).toBe('farm-1');
    });

    it('should throw UnauthorizedException when user has no access to farm', async () => {
      farmsService.findByUserId!.mockResolvedValue([
        { farm: { id: 'other-farm' }, role: 'OWNER' },
      ]);

      await expect(
        authService.switchFarm('user-id', 'farm-no-access'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user has no farms at all', async () => {
      farmsService.findByUserId!.mockResolvedValue([]);

      await expect(
        authService.switchFarm('user-id', 'any-farm'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================
  // EMAIL AVAILABILITY CHECK
  // ===========================================================
  describe('checkEmailAvailability', () => {
    it('should return available: true when email is not taken', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const result = await authService.checkEmailAvailability('new@test.com');

      expect(result.available).toBe(true);
    });

    it('should return available: false when email is taken', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);

      const result = await authService.checkEmailAvailability(
        'test@example.com',
      );

      expect(result.available).toBe(false);
    });
  });

  // ===========================================================
  // LINK USER TO FARM
  // ===========================================================
  describe('linkUserToFarm', () => {
    it('should link user to farm with OWNER role by default', async () => {
      farmsService.linkUserToFarm!.mockResolvedValue(undefined);

      await authService.linkUserToFarm('user-id', 'farm-id');

      expect(farmsService.linkUserToFarm).toHaveBeenCalledWith(
        'user-id',
        'farm-id',
        'OWNER',
      );
    });

    it('should link user to farm with WORKER role', async () => {
      farmsService.linkUserToFarm!.mockResolvedValue(undefined);

      await authService.linkUserToFarm('user-id', 'farm-id', 'WORKER');

      expect(farmsService.linkUserToFarm).toHaveBeenCalledWith(
        'user-id',
        'farm-id',
        'WORKER',
      );
    });

    it('should normalize role to uppercase', async () => {
      farmsService.linkUserToFarm!.mockResolvedValue(undefined);

      await authService.linkUserToFarm('user-id', 'farm-id', 'admin');

      expect(farmsService.linkUserToFarm).toHaveBeenCalledWith(
        'user-id',
        'farm-id',
        'ADMIN',
      );
    });
  });
});
