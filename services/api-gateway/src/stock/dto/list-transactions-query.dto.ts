import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({
    example: 'farm-123',
    description: 'Filter by farm ID',
  })
  @IsString()
  @IsOptional()
  farmId?: string;

  @ApiPropertyOptional({
    example: 'farm-123',
    description: 'Filter by farm ID (legacy)',
  })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiPropertyOptional({
    example: 'mat-123',
    description: 'Filter by material ID',
  })
  @IsString()
  @IsOptional()
  materialId?: string;

  @ApiPropertyOptional({ example: 'mat-123' })
  @IsString()
  @IsOptional()
  material_id?: string;

  @ApiPropertyOptional({
    example: 'PURCHASE',
    description:
      'Filter by transaction type (PURCHASE, CONSUMPTION, ADJUSTMENT)',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date filter',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date filter (legacy)',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'End date filter',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'End date filter (legacy)',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Pagination page',
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Pagination limit',
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 0,
    description: 'Pagination offset',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}
