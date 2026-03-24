import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from './create-transaction.dto';

export class UpdateTransactionDto {
    @ApiProperty({ enum: TransactionType, required: false })
    @IsEnum(TransactionType)
    @IsOptional()
    type?: TransactionType;

    @ApiProperty({ example: 50, description: 'Updated quantity', required: false })
    @IsNumber()
    @IsOptional()
    quantity?: number;

    @ApiPropertyOptional({ example: 2.5, description: 'Updated unit cost' })
    @IsNumber()
    @IsOptional()
    unitCost?: number;

    @ApiPropertyOptional({ example: 2.5 })
    @IsNumber()
    @IsOptional()
    unit_cost?: number;

    @ApiProperty({ example: 'Updated notes', required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}
