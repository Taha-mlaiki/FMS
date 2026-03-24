import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaterialDto {
  @ApiPropertyOptional({ example: 'NPK Fertilizer v2' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'feed' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @IsOptional()
  min_threshold?: number;
}
