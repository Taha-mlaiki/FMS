import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListWorkersQueryDto {
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
    example: 'active',
    description: 'Filter by worker status (active, pending, inactive)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Pagination page number (1-based)',
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

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
}
