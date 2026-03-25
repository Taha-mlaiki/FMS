import {
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetMetricsQueryDto {
  @ApiProperty({ example: 'farm-123', description: 'Filter by farm ID' })
  @IsString()
  @IsNotEmpty()
  farmId: string;

  @ApiPropertyOptional({
    example: 'farm-123',
    description: 'Filter by farm ID (legacy)',
  })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiPropertyOptional({
    example: 'group-123',
    description: 'Filter by animal group ID',
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ example: 'group-123' })
  @IsString()
  @IsOptional()
  group_id?: string;

  @ApiPropertyOptional({
    example: 'WEIGHT',
    description:
      'Filter by metric type (WEIGHT, MORTALITY, COUNT, FEED_CONSUMPTION)',
  })
  @IsString()
  @IsOptional()
  metricType?: string;

  @ApiPropertyOptional({ example: 'WEIGHT' })
  @IsString()
  @IsOptional()
  metric_type?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date for metric records (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'End date for metric records (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
