import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MetricType {
  WEIGHT = 'WEIGHT',
  MORTALITY = 'MORTALITY',
  COUNT = 'COUNT',
  FEED_CONSUMPTION = 'FEED_CONSUMPTION',
}

export class RecordMetricsDto {
  @ApiProperty({
    example: 'group-123',
    description: 'The ID of the animal group',
  })
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({
    example: 'group-123',
    description: 'The ID of the animal group (legacy)',
  })
  @IsString()
  @IsNotEmpty()
  group_id: string;

  @ApiProperty({ enum: MetricType, example: MetricType.WEIGHT })
  @IsEnum(MetricType)
  type: MetricType;

  @ApiProperty({
    example: 450.5,
    description: 'The value of the metric recorded',
  })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 'kg', description: 'The unit of measurement' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ example: 'farm-123', description: 'The ID of the farm' })
  @IsString()
  @IsNotEmpty()
  farmId: string;

  @ApiProperty({
    example: 'farm-123',
    description: 'The ID of the farm (legacy)',
  })
  @IsString()
  @IsNotEmpty()
  farm_id: string;
}
