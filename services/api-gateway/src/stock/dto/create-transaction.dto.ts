import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  CONSUMPTION = 'CONSUMPTION',
  DAMAGE = 'DAMAGE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateTransactionDto {
  @ApiProperty({ example: 'mat-123', description: 'The ID of the material' })
  @IsString()
  @IsNotEmpty()
  material_id: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.PURCHASE })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 50, description: 'Quantity involved in transaction' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Unit cost' })
  @IsNumber()
  @IsOptional()
  unit_cost?: number;

  @ApiPropertyOptional({ example: 'Restocking for spring season' })
  @IsString()
  @IsOptional()
  notes?: string;
}
