import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>, plainPassword?: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('auth.email_already_exists');
    }

    // The 'data' object, being Partial<User>, already includes firstName and lastName
    // if they are properties of the User entity. The .create(data) method
    // correctly maps these properties to the new User instance.
    const user = this.userRepository.create(data);

    if (plainPassword) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(plainPassword, salt);
    }

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber: phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      currentHashedRefreshToken,
    });
  }

  async removeRefreshToken(userId: string) {
    return this.userRepository.update(userId, {
      currentHashedRefreshToken: undefined, // TypeORM updates with undefined effectively sets to NULL if column allows it
    } as any);
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.findById(userId);

    if (!user || !user.currentHashedRefreshToken) {
      throw new UnauthorizedException('auth.refresh_token_invalid');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }

    throw new UnauthorizedException('Invalid refresh token');
  }
  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('auth.user_not_found');
    return updated;
  }

  async changePassword(
    id: string,
    currentPlain: string,
    nextPlain: string,
  ): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('auth.user_not_found');

    const isMatch = await bcrypt.compare(currentPlain, user.passwordHash);
    if (!isMatch)
      throw new UnauthorizedException('auth.current_password_incorrect');

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(nextPlain, salt);
    user.currentHashedRefreshToken = null;
    await this.userRepository.save(user);
  }
}
