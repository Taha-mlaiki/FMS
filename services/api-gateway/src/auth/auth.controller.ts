// ================================================================
// Auth Controller — Gateway Side (HTTP endpoints)
// ================================================================
// Three endpoints:
//   POST /auth/register → PUBLIC  (no guard, anyone can register)
//   POST /auth/login    → PUBLIC  (no guard, anyone can login)
//   GET  /auth/profile  → PROTECTED (requires valid JWT token)
//
// The @UseGuards(JwtAuthGuard) decorator tells NestJS:
// "Before running this method, check if the user has a valid token."
//
// The @UsePipes(ValidationPipe) is set GLOBALLY in main.ts,
// so all DTOs are validated automatically — no need to add it here.
// ================================================================

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { Public } from './public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    // Clear first so an older duplicate token cookie cannot win during parsing.
    this.clearRefreshTokenCookie(res);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  private readRefreshTokenFromCookie(req: Request): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const entries = cookieHeader.split(';').map((part) => part.trim());
    // Prefer the last matching cookie because browsers can send duplicate
    // names when attributes differ (old/new), and the newest one is typically
    // appended later in the header.
    const found = [...entries]
      .reverse()
      .find((entry) => entry.startsWith('refreshToken='));
    if (!found) return null;
    return decodeURIComponent(found.slice('refreshToken='.length));
  }

  // -------------------------------------------------------
  // POST /auth/register — PUBLIC
  // -------------------------------------------------------
  // ValidationPipe (global) checks RegisterDto decorators:
  //   - @IsEmail() → rejects "not-an-email"
  //   - @MinLength(6) → rejects "ab"
  //   - @IsNotEmpty() → rejects missing fields
  //
  // If validation passes, forward to auth-service via gRPC.
  // -------------------------------------------------------
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with role, email, and password only. Farm creation is a separate onboarding step via /api/farms. This endpoint is public and does not require authentication.',
  })
  @ApiResponse({
    status: 201,
    description:
      'User successfully registered. Returns tokens and user profile. No farm is created during registration.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error — invalid email format, password too short, or missing required fields',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict — a user with this email already exists',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, response.refreshToken);
    const { refreshToken: _refreshToken, ...safeResponse } = response;
    return safeResponse;
  }

  // -------------------------------------------------------
  // POST /auth/login — PUBLIC
  // -------------------------------------------------------
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login user and get access tokens',
    description:
      'Authenticates a user with email and password credentials. Returns a JWT access token that must be included as a Bearer token in the Authorization header for all protected endpoints. This endpoint is public and does not require authentication.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns JWT access token and user information.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials — email not found or password does not match',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, response.refreshToken);
    const { refreshToken: _refreshToken, ...safeResponse } = response;
    return safeResponse;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Uses the HttpOnly refresh token cookie to rotate tokens and return a new access token.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.readRefreshTokenFromCookie(req);
    if (!refreshToken) {
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('Refresh token missing');
    }

    const response = await this.authService.refreshToken(refreshToken);
    this.setRefreshTokenCookie(res, response.refreshToken);
    return { accessToken: response.accessToken };
  }

  // -------------------------------------------------------
  // GET /auth/profile — PROTECTED (requires JWT)
  // -------------------------------------------------------
  // @UseGuards(JwtAuthGuard) runs the guard before this method.
  //
  // If the guard passes:
  //   - request.user contains the decoded JWT payload
  //   - { sub: "user-id-123", email: "user@example.com" }
  //
  // If the guard fails:
  //   - 401 Unauthorized is returned automatically
  //   - This method NEVER executes
  // -------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get current user profile (/auth/me)',
    description:
      "Returns the currently authenticated user's profile information extracted from the JWT token. Requires a valid Bearer token in the Authorization header.",
  })
  @ApiResponse({
    status: 200,
    description:
      'Profile retrieved successfully. Returns the decoded JWT payload with user details.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT token',
  })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfileAlias(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    const [firstName, ...lastNameParts] = (dto.fullName ?? '')
      .trim()
      .split(/\s+/);
    return this.authService.updateProfile(req.user.sub, {
      firstName: firstName || undefined,
      lastName: lastNameParts.join(' ') || undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Change password and revoke refresh token' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    this.clearRefreshTokenCookie(res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeRefreshToken(req.user.sub);
    this.clearRefreshTokenCookie(res);
  }

  @Public()
  @Get('check-email')
  @ApiOperation({ summary: 'Check email availability' })
  checkEmail(@Query('email') email: string) {
    return this.authService.checkEmailAvailability(email);
  }
}
