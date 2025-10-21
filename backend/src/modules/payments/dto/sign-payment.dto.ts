import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class SignPaymentDto {
  @ApiProperty({ example: 'CMS' })
  @IsString()
  signatureType: string;

  @ApiProperty()
  @IsString()
  signature: string; // base64

  @ApiProperty()
  @IsString()
  certThumbprint: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  chain?: string[];
}
