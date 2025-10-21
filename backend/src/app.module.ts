import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CounterpartiesModule } from './modules/counterparties/counterparties.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';
import { BankEmulatorModule } from './modules/bank-emulator/bank-emulator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL) || 60,
        limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    PaymentsModule,
    CounterpartiesModule,
    MessagesModule,
    AuditModule,
    StorageModule,
    BankEmulatorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
