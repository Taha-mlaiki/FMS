import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportAnalyticsQueryDto {
  @ApiProperty({ example: 'farm-123', description: 'Filter by farm ID' })
  @IsString()
  farm_id!: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Analytics start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Analytics end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
