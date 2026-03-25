import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { User, UserRole } from '../entities/user.entity';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: Record<string, jest.Mock>;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.OWNER,
    phoneNumber: '+1234567890',
    isActive: true,
    currentHashedRefreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================
  // CREATE USER
  // ===========================================================
  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({ ...mockUser });
      repository.save.mockResolvedValue({ ...mockUser });

      const result = await service.create(
        { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        'plainPassword',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 'salt');
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException for duplicate email', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({ email: 'test@example.com' }, 'pass'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user without password (e.g., OAuth)', async () => {
      repository.findOne.mockResolvedValue(null);
      const userWithoutHash = { ...mockUser, passwordHash: undefined };
      repository.create.mockReturnValue(userWithoutHash);
      repository.save.mockResolvedValue(userWithoutHash);

      const result = await service.create({
        email: 'oauth@example.com',
        firstName: 'O',
        lastName: 'Auth',
      });

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ===========================================================
  // FIND METHODS
  // ===========================================================
  describe('findByEmail', () => {
    it('should return user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('missing@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findByPhone', () => {
    it('should return user when found by phone', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      const result = await service.findByPhone('+1234567890');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return user when found by id', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      const result = await service.findById('user-uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  // ===========================================================
  // REFRESH TOKEN MANAGEMENT
  // ===========================================================
  describe('setCurrentRefreshToken', () => {
    it('should hash and store the refresh token', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-rt');
      repository.update.mockResolvedValue({ affected: 1 });

      await service.setCurrentRefreshToken('refresh-token', 'user-id');

      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
      expect(repository.update).toHaveBeenCalledWith('user-id', {
        currentHashedRefreshToken: 'hashed-rt',
      });
    });
  });

  describe('removeRefreshToken', () => {
    it('should clear the stored refresh token', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.removeRefreshToken('user-id');

      expect(repository.update).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({ currentHashedRefreshToken: undefined }),
      );
    });
  });

  describe('getUserIfRefreshTokenMatches', () => {
    it('should return user when refresh token matches', async () => {
      const userWithToken = {
        ...mockUser,
        currentHashedRefreshToken: 'hashed-rt',
      };
      repository.findOne.mockResolvedValue(userWithToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.getUserIfRefreshTokenMatches(
        'refresh-token',
        'user-uuid-1',
      );

      expect(result).toEqual(userWithToken);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getUserIfRefreshTokenMatches('rt', 'missing-id'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user has no stored refresh token', async () => {
      repository.findOne.mockResolvedValue({
        ...mockUser,
        currentHashedRefreshToken: null,
      });

      await expect(
        service.getUserIfRefreshTokenMatches('rt', 'user-uuid-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token does not match', async () => {
      repository.findOne.mockResolvedValue({
        ...mockUser,
        currentHashedRefreshToken: 'hashed-rt',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.getUserIfRefreshTokenMatches('wrong-rt', 'user-uuid-1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================================================
  // PROFILE MANAGEMENT
  // ===========================================================
  describe('updateProfile', () => {
    it('should update and return the user', async () => {
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
      });

      const result = await service.updateProfile('user-uuid-1', {
        firstName: 'Updated',
      });

      expect(repository.update).toHaveBeenCalledWith('user-uuid-1', {
        firstName: 'Updated',
      });
      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException when user not found after update', async () => {
      repository.update.mockResolvedValue({ affected: 0 });
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('missing-id', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      repository.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('new-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      repository.save.mockResolvedValue({});

      await service.changePassword('user-uuid-1', 'oldPass', 'newPass');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldPass',
        mockUser.passwordHash,
      );
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass', 'new-salt');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('missing-id', 'old', 'new'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      repository.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-uuid-1', 'wrong', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should clear refresh token on password change', async () => {
      repository.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repository.save.mockImplementation((user: Record<string, unknown>) => {
        expect(user['currentHashedRefreshToken']).toBeNull();
        return Promise.resolve(user);
      });

      await service.changePassword('user-uuid-1', 'oldPass', 'newPass');
    });
  });
});
