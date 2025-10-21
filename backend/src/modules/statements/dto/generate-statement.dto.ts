import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateStatementDto {
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty()
  @IsDateString()
  dateFrom: string;

  @ApiProperty()
  @IsDateString()
  dateTo: string;
}
