import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BaseQueryDto {
    @ApiProperty({ example: 'farm-123', description: 'Filter by farm ID' })
    @IsString()
    @IsNotEmpty()
    farm_id: string;

    @ApiPropertyOptional({ example: 0, description: 'Pagination offset' })
    @IsInt()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    offset?: number = 0;

    @ApiPropertyOptional({ example: 10, description: 'Pagination limit' })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 10;
}
