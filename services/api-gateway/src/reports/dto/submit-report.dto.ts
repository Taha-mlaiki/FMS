import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitReportDto {
  @ApiProperty({ example: 'farm-123', description: 'The ID of the farm' })
  @IsString()
  @IsNotEmpty()
  farm_id!: string;

  @ApiPropertyOptional({
    example: 'user-456',
    description: 'ID of the user submitting the report',
  })
  @IsString()
  @IsOptional()
  submitted_by?: string;
}
