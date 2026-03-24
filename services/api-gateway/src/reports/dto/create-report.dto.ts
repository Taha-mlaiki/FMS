import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  INCIDENT = 'INCIDENT',
  PROGRESS = 'PROGRESS',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ReportSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateReportDto {
  @ApiProperty({
    example: 'Broken Fence Sector 4',
    description: 'Title of the report',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example:
      'The perimeter fence in sector 4 is damaged and needs immediate repair.',
    description: 'Detailed description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ReportType, example: ReportType.INCIDENT })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ReportSeverity, example: ReportSeverity.MEDIUM })
  @IsEnum(ReportSeverity)
  severity: ReportSeverity;

  @ApiPropertyOptional({
    example: 'task-123',
    description: 'Optional related task ID',
  })
  @IsString()
  @IsOptional()
  task_id?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional array of related group IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  group_ids?: string[];
}
