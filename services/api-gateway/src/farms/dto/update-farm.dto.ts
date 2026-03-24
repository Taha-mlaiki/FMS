import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFarmDto {
  @ApiPropertyOptional({ example: 'Green Valley Farm' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Cairo, Egypt' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Cairo, Egypt' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'poultry' })
  @IsOptional()
  @IsString()
  type?: string;
}
