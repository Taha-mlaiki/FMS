import { ApiProperty } from '@nestjs/swagger';

export class GenericResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Descriptive message',
  })
  message: string;
}
