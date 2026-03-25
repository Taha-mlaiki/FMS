import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    example: 'NPK Fertilizer',
    description: 'Name of the material',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'feed',
    description: 'Category: feed, vaccine, medicine, equipment, other',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 100, description: 'Initial quantity in stock' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    example: 'kg',
    description: 'Unit of measurement: kg, litre, piece, dose',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Minimum quantity before low-stock alert',
  })
  @IsNumber()
  @IsOptional()
  min_threshold?: number;
}
