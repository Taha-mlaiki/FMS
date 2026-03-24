// ================================================================
// LoginDto — Validation for login requests
// ================================================================
// Supports login via email OR phone. At least one must be provided.
// ================================================================

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required when phone is not provided' })
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @ValidateIf((o) => !o.email)
  @Matches(/^\+?\d{8,15}$/, { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone is required when email is not provided' })
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
