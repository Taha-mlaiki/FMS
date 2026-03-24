import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportSeverity } from './create-report.dto';

export class UpdateReportDto {
  @ApiPropertyOptional({ example: 'Updated Report Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description content.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ReportType })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @ApiPropertyOptional({ enum: ReportSeverity })
  @IsEnum(ReportSeverity)
  @IsOptional()
  severity?: ReportSeverity;

  @ApiPropertyOptional({ example: 'task-123' })
  @IsString()
  @IsOptional()
  task_id?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  group_ids?: string[];
}
