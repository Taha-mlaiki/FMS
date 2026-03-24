import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class ListMaterialsQueryDto {
  @ApiPropertyOptional({ example: 'farm-123', description: 'Filter by farm ID' })
  @IsString()
  @IsOptional()
  farmId?: string;

  @ApiPropertyOptional({ example: 'farm-123', description: 'Filter by farm ID (legacy)' })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiPropertyOptional({
    example: 'feed',
    description:
      'Filter by category (feed, vaccine, medicine, equipment, other)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Show only low-stock materials',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  lowStockOnly?: boolean;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  low_stock_only?: boolean;

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
}
