// ================================================================
// JWT Auth Guard — Protects Routes on the Gateway
// ================================================================
// A Guard in NestJS runs BEFORE the route handler.
// It decides: "Should this request be allowed through?"
//
// FLOW:
//   1. Client sends: GET /auth/profile
//      Headers: { Authorization: "Bearer eyJhbGci..." }
//
//   2. This guard runs BEFORE the controller method:
//      - Extracts the token from the "Authorization" header
//      - Verifies the token using the JWT secret
//      - If valid → attaches user info to request.user, returns true
//      - If invalid/missing → throws 401 Unauthorized
//
//   3. Only if the guard returns true, the controller method executes.
//
// USAGE in a controller:
//   @UseGuards(JwtAuthGuard)
//   @Get('profile')
//   getProfile(@Req() req) {
//     return req.user;  // ← user info from the decoded JWT
//   }
// ================================================================

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { FarmMembership } from '../auth/auth.service';

// -------------------------------------------------------
// JwtPayload — The shape of the decoded JWT token
// -------------------------------------------------------
// When the auth-service creates a token, it puts this data
// inside: { sub: "user-id", email: "user@email.com" }
// After verification, we get this payload back.
// -------------------------------------------------------
export interface JwtPayload {
  sub: string;
  email: string;
  farmId?: string; // Current active farm for the session
  iat: number;
  exp: number;
}

// Extend the Express Request to include our typed user
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  farmMembership?: FarmMembership;
}

// -------------------------------------------------------
// CanActivate interface
// -------------------------------------------------------
// Every guard must implement canActivate().
// It returns true (allow) or false (deny).
// If it throws an exception, NestJS sends the error response.
// -------------------------------------------------------

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    // -------------------------------------------------------
    // Step 1: Get the HTTP request object
    // -------------------------------------------------------
    const request = context.switchToHttp().getRequest<Request>();

    // -------------------------------------------------------
    // Step 2: Extract the token from the Authorization header
    // -------------------------------------------------------
    // Header format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    // We split by space and take the second part (the token).
    // -------------------------------------------------------
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // -------------------------------------------------------
    // Step 3: Verify the token
    // -------------------------------------------------------
    // jwtService.verifyAsync() does TWO things:
    //   1. Checks the signature (was this token created with our secret?)
    //   2. Checks expiration (is the token still valid?)
    //
    // If either fails, it throws an error → we catch it → 401.
    // If it succeeds, it returns the decoded payload:
    //   { sub: "user-id-123", email: "user@example.com", iat: ..., exp: ... }
    // -------------------------------------------------------
    try {
      const payload: JwtPayload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      // -------------------------------------------------------
      // Step 4: Attach user info to the request
      // -------------------------------------------------------
      // Now any controller method can access req.user to know
      // WHO is making the request.
      // -------------------------------------------------------
      (request as AuthenticatedRequest).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Allow the request to proceed to the controller
    return true;
  }

  // -------------------------------------------------------
  // Helper: Extract "Bearer <token>" from the header
  // -------------------------------------------------------
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
