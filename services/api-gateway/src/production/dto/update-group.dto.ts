import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Cattle Group A - Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 48,
    description: 'Current number of animals in the group',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  current_quantity?: number;

  @ApiPropertyOptional({
    example: 'Holstein',
    description: 'Breed of the group (optional)',
  })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({
    example: 'layer',
    description: 'Group type (e.g. broiler, layer)',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: 'Barn A',
    description: 'Building/house identifier',
  })
  @IsString()
  @IsOptional()
  building?: string;

  @ApiPropertyOptional({ example: 'Active/Sold/Processed' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: '2026-01-15T00:00:00Z',
    description: 'Date the group arrived at the farm',
  })
  @IsDateString()
  @IsOptional()
  arrival_date?: string;

  @ApiPropertyOptional({
    example: '2026-01-15T00:00:00Z',
    description: 'Deprecated alias for arrival_date',
  })
  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-15T00:00:00Z',
    description: 'Deprecated alias for arrival_date',
  })
  @IsDateString()
  @IsOptional()
  entry_date?: string;
}
