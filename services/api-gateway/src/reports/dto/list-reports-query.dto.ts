import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListReportsQueryDto {
  @ApiPropertyOptional({
    example: 'farm-123',
    description: 'Farm ID (used by access guard)',
  })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiPropertyOptional({
    example: 'INCIDENT',
    description: 'Filter by report type (INCIDENT, PROGRESS, MAINTENANCE)',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: 'MEDIUM',
    description: 'Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)',
  })
  @IsString()
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({
    example: 'DRAFT',
    description: 'Legacy status filter (accepted, ignored by service)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'task-123',
    description: 'Filter by related task',
  })
  @IsString()
  @IsOptional()
  task_id?: string;

  @ApiPropertyOptional({
    example: 'group-123',
    description: 'Filter by linked animal group (first match)',
  })
  @IsString()
  @IsOptional()
  group_id?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by multiple group IDs (overlap)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  group_ids?: string[];

  @ApiPropertyOptional({
    example: 'user-123',
    description: 'Filter by creator',
  })
  @IsString()
  @IsOptional()
  created_by?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date filter (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'End date filter (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

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

  @ApiPropertyOptional({
    example: 'created_at',
    description: 'Sort field (created_at, severity)',
  })
  @IsString()
  @IsOptional()
  sort_by?: string;
}
