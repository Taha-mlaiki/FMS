import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'worker@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'WORKER', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'WORKER', 'CONSULTANT'])
  role?: string;
}
