// ================================================================
// RegisterDto — Validation for registration requests
// ================================================================
// DTOs (Data Transfer Objects) define the SHAPE of incoming data.
// With class-validator decorators, they also VALIDATE the data
// automatically before it reaches the controller.
//
// If validation fails, NestJS returns a 400 Bad Request with
// details about what's wrong — the controller never runs.
//
// Example invalid request:
//   { "email": "not-an-email", "password": "ab" }
//   → 400: ["email must be an email", "password must be longer than 6 characters"]
// ================================================================

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum RegisterRole {
  OWNER = 'owner',
  WORKER = 'worker',
}

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: '+201234567890',
    description: 'Optional phone number',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^\+?\d{8,15}$/, {
    message: 'Please provide a valid phone number',
  })
  phone?: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 chars)',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiProperty({
    example: 'owner',
    enum: RegisterRole,
    description: 'User role selected at registration',
  })
  @IsEnum(RegisterRole, { message: 'Role must be either owner or worker' })
  role!: RegisterRole;
}
