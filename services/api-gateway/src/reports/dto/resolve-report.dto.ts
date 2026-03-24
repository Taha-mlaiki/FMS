import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveReportDto {
  @ApiProperty({ example: 'farm-123', description: 'The ID of the farm' })
  @IsString()
  @IsNotEmpty()
  farm_id!: string;

  @ApiPropertyOptional({
    example: 'user-789',
    description: 'ID of the user resolving the report',
  })
  @IsString()
  @IsOptional()
  resolved_by?: string;

  @ApiPropertyOptional({
    example: 'Fence repaired and reinforced with new posts',
    description: 'Resolution notes',
  })
  @IsString()
  @IsOptional()
  resolution_notes?: string;
}
