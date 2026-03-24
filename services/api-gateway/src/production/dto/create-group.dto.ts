import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Cattle Group A',
    description: 'Name of the animal group',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'broiler',
    description: 'Type of the animals (e.g. broiler, layer)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  // Backward-compatible alias for old clients; controller maps species -> type.
  @ApiProperty({ example: 'broiler', description: 'Deprecated alias for type' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiProperty({ example: 'Holstein', description: 'Breed of the animals' })
  @IsString()
  @IsNotEmpty()
  breed: string;

  @ApiProperty({
    example: '2026-01-15T00:00:00Z',
    description: 'Date the group arrived at the farm',
  })
  @IsDateString()
  @IsNotEmpty()
  arrival_date: string;

  // Backward-compatible aliases for old clients.
  @ApiProperty({
    example: '2026-01-15T00:00:00Z',
    description: 'Deprecated alias for arrival_date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiProperty({
    example: '2026-01-15T00:00:00Z',
    description: 'Deprecated alias for arrival_date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  entry_date?: string;

  @ApiProperty({
    example: 50,
    description: 'Initial number of animals in the group',
  })
  @IsNumber()
  @IsPositive()
  initial_quantity: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  initialQuantity?: number;

  @ApiProperty({ example: 'farm-123', description: 'The ID of the farm' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  farm_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  farmId?: string;
}
