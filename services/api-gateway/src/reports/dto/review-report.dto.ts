import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewReportDto {
  @ApiProperty({ example: 'farm-123', description: 'The ID of the farm' })
  @IsString()
  @IsNotEmpty()
  farm_id!: string;

  @ApiPropertyOptional({
    example: 'user-789',
    description: 'ID of the reviewer',
  })
  @IsString()
  @IsOptional()
  reviewed_by?: string;

  @ApiPropertyOptional({
    example: 'Issue confirmed, needs immediate fix',
    description: 'Notes from the reviewer',
  })
  @IsString()
  @IsOptional()
  review_notes?: string;
}
