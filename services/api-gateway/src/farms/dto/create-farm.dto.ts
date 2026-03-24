import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'My First Farm' })
  @IsString({ message: 'Farm name must be a string' })
  @IsNotEmpty({ message: 'Farm name is required' })
  name!: string;

  @ApiPropertyOptional({ example: 'Riyadh, Saudi Arabia' })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @ApiPropertyOptional({ example: 'poultry' })
  @IsOptional()
  @IsString({ message: 'Type must be a string' })
  type?: string;
}
