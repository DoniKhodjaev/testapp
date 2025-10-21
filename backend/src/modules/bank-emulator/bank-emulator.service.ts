import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, Prisma } from '@prisma/client';

/**
 * Bank Emulator Service
 * Simulates bank processing of payments for testing
 */
@Injectable()
export class BankEmulatorService implements OnModuleInit {
  private readonly logger = new Logger(BankEmulatorService.name);
  private processingInterval: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const enabled = process.env.BANK_EMULATOR_ENABLED === 'true';
    if (enabled) {
      this.logger.log('Bank Emulator is enabled');
      this.startProcessing();
    } else {
      this.logger.log('Bank Emulator is disabled');
    }
  }

  /**
   * Start automatic payment processing
   */
  startProcessing() {
    // Process every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processPayments().catch((error) => {
        this.logger.error('Error processing payments:', error);
      });
    }, 5000);

    this.logger.log('Started automatic payment processing (every 5 seconds)');
  }

  /**
   * Stop processing
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.logger.log('Stopped automatic payment processing');
    }
  }

  /**
   * Process pending payments
   */
  async processPayments() {
    // Find payments in SENT status
    const sentPayments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.SENT },
      include: { account: true },
      take: 10, // Process max 10 at a time
    });

    if (sentPayments.length === 0) {
      return;
    }

    this.logger.log(`Processing ${sentPayments.length} sent payments...`);

    for (const payment of sentPayments) {
      await this.processPayment(payment);
    }
  }

  /**
   * Process individual payment
   */
  private async processPayment(payment: any) {
    try {
      // Simulate bank validation
      const validationResult = this.validatePayment(payment);

      if (!validationResult.valid) {
        // Reject payment
        await this.rejectPayment(payment.id, validationResult.reason);
        this.logger.warn(`Payment ${payment.id} rejected: ${validationResult.reason}`);
        return;
      }

      // Accept by bank
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.BANK_ACCEPTED },
      });

      await this.prisma.paymentHistory.create({
        data: {
          paymentId: payment.id,
          fromStatus: PaymentStatus.SENT,
          toStatus: PaymentStatus.BANK_ACCEPTED,
          comment: 'Payment accepted by bank',
          metadata: { timestamp: new Date() },
        },
      });

      this.logger.log(`Payment ${payment.id} accepted by bank`);

      // Schedule posting (simulate T+0 or T+1 processing)
      setTimeout(async () => {
        await this.postPayment(payment.id, payment.accountId, payment.amount);
      }, this.getPostingDelay());
    } catch (error) {
      this.logger.error(`Error processing payment ${payment.id}:`, error);
      await this.rejectPayment(payment.id, 'Internal bank error');
    }
  }

  /**
   * Validate payment (simulate bank checks)
   */
  private validatePayment(payment: any): { valid: boolean; reason?: string } {
    // Check account balance (informational, not blocking in real scenario)
    if (payment.account.balance < payment.amount) {
      return {
        valid: false,
        reason: 'Insufficient funds',
      };
    }

    // Random rejection for testing (5% chance)
    if (Math.random() < 0.05) {
      return {
        valid: false,
        reason: 'Random bank validation failure (testing)',
      };
    }

    // Check BIC format
    if (!/^\d{9}$/.test(payment.receiverBic)) {
      return {
        valid: false,
        reason: 'Invalid receiver BIC format',
      };
    }

    // Check account format
    if (!/^\d{20}$/.test(payment.receiverAccount.replace(/\s/g, ''))) {
      return {
        valid: false,
        reason: 'Invalid receiver account format',
      };
    }

    return { valid: true };
  }

  /**
   * Post payment (mark as completed and update balance)
   */
  private async postPayment(paymentId: string, accountId: string, amount: Prisma.Decimal) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || payment.status !== PaymentStatus.BANK_ACCEPTED) {
        return; // Already processed or cancelled
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.POSTED,
          valueDate: new Date(),
        },
      });

      // Update account balance
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Add history
      await this.prisma.paymentHistory.create({
        data: {
          paymentId,
          fromStatus: PaymentStatus.BANK_ACCEPTED,
          toStatus: PaymentStatus.POSTED,
          comment: 'Payment posted successfully',
          metadata: { timestamp: new Date() },
        },
      });

      this.logger.log(`Payment ${paymentId} posted, account balance updated`);
    } catch (error) {
      this.logger.error(`Error posting payment ${paymentId}:`, error);
    }
  }

  /**
   * Reject payment
   */
  private async rejectPayment(paymentId: string, reason: string) {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    await this.prisma.paymentHistory.create({
      data: {
        paymentId,
        fromStatus: PaymentStatus.SENT,
        toStatus: PaymentStatus.REJECTED,
        comment: `Payment rejected: ${reason}`,
        metadata: { timestamp: new Date(), reason },
      },
    });
  }

  /**
   * Get random posting delay (simulate T+0 or T+1)
   */
  private getPostingDelay(): number {
    const delay = parseInt(process.env.BANK_EMULATOR_DELAY) || 10000;
    // Add some randomness (±50%)
    return delay + Math.random() * delay - delay / 2;
  }

  /**
   * Manual processing of a specific payment (for testing)
   */
  async processPaymentManual(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { account: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.SENT) {
      throw new Error('Payment must be in SENT status');
    }

    await this.processPayment(payment);
    return { success: true, message: 'Payment processing initiated' };
  }
}
