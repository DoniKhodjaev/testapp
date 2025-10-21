import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VKDocType {
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  SUPPORTING = 'SUPPORTING',
  OTHER = 'OTHER',
}

export class UploadFileDto {
  @ApiProperty({ enum: VKDocType })
  @IsEnum(VKDocType)
  docType: VKDocType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
