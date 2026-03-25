import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StockAnalyticsQueryDto {
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
    example: 'feed',
    description: 'Filter by material category',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
