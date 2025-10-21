import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ReceiverDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  inn: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  kpp?: string;

  @ApiProperty()
  @IsString()
  accountNo: string;

  @ApiProperty()
  @IsString()
  bic: string;
}

class BudgetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  kbk?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oktmo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uip?: string;
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty()
  @IsDateString()
  date: Date;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ default: 'RUB' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ReceiverDto)
  receiver: ReceiverDto;

  @ApiProperty()
  @IsString()
  purpose: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetDto)
  budget?: BudgetDto;

  @ApiProperty({ default: 5 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}
