import { Module } from '@nestjs/common';
import { BankEmulatorService } from './bank-emulator.service';

@Module({
  providers: [BankEmulatorService],
  exports: [BankEmulatorService],
})
export class BankEmulatorModule {}
