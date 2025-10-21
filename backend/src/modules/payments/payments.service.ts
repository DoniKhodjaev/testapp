import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { SignPaymentDto } from './dto/sign-payment.dto';
import { PaymentValidationService } from './payment-validation.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private validationService: PaymentValidationService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string, companyId: string) {
    // Validate payment data
    const errors = await this.validationService.validate(createPaymentDto);
    if (errors.length > 0) {
      throw new BadRequestException({ errors });
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        accountId: createPaymentDto.accountId,
        date: createPaymentDto.date,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'RUB',
        receiverName: createPaymentDto.receiver.name,
        receiverInn: createPaymentDto.receiver.inn,
        receiverKpp: createPaymentDto.receiver.kpp,
        receiverAccount: createPaymentDto.receiver.accountNo,
        receiverBic: createPaymentDto.receiver.bic,
        purpose: createPaymentDto.purpose,
        kbk: createPaymentDto.budget?.kbk,
        oktmo: createPaymentDto.budget?.oktmo,
        uip: createPaymentDto.budget?.uip,
        priority: createPaymentDto.priority || 5,
        status: PaymentStatus.DRAFT,
        createdBy: userId,
      },
      include: {
        account: true,
        creator: { select: { id: true, email: true, role: true } },
      },
    });

    // Log history
    await this.prisma.paymentHistory.create({
      data: {
        paymentId: payment.id,
        toStatus: PaymentStatus.DRAFT,
        comment: 'Payment created',
        metadata: { userId },
      },
    });

    return payment;
  }

  async findAll(companyId: string, filters?: any) {
    const where: any = { companyId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.from) {
      where.date = { ...where.date, gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.date = { ...where.date, lte: new Date(filters.to) };
    }
    if (filters.q) {
      where.OR = [
        { purpose: { contains: filters.q, mode: 'insensitive' } },
        { receiverName: { contains: filters.q, mode: 'insensitive' } },
        { receiverInn: { contains: filters.q } },
      ];
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          account: true,
          creator: { select: { id: true, email: true, role: true } },
          signatures: { include: { user: { select: { email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: filters.skip || 0,
        take: filters.take || 50,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items: payments, total };
  }

  async findOne(id: string, companyId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
      include: {
        account: true,
        creator: { select: { id: true, email: true, role: true } },
        signatures: { include: { user: { select: { email: true } } } },
        files: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, companyId: string) {
    const payment = await this.findOne(id, companyId);

    // Can only update DRAFT or ON_APPROVAL
    if (![PaymentStatus.DRAFT, PaymentStatus.ON_APPROVAL].includes(payment.status)) {
      throw new BadRequestException('Cannot update payment in current status');
    }

    // Validate
    if (Object.keys(updatePaymentDto).length > 0) {
      const errors = await this.validationService.validate(updatePaymentDto as any);
      if (errors.length > 0) {
        throw new BadRequestException({ errors });
      }
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        ...(updatePaymentDto.receiver && {
          receiverName: updatePaymentDto.receiver.name,
          receiverInn: updatePaymentDto.receiver.inn,
          receiverKpp: updatePaymentDto.receiver.kpp,
          receiverAccount: updatePaymentDto.receiver.accountNo,
          receiverBic: updatePaymentDto.receiver.bic,
        }),
        ...(updatePaymentDto.amount !== undefined && { amount: updatePaymentDto.amount }),
        ...(updatePaymentDto.purpose !== undefined && { purpose: updatePaymentDto.purpose }),
        ...(updatePaymentDto.budget && {
          kbk: updatePaymentDto.budget.kbk,
          oktmo: updatePaymentDto.budget.oktmo,
          uip: updatePaymentDto.budget.uip,
        }),
      },
    });

    return updated;
  }

  async submit(id: string, companyId: string, userId: string) {
    const payment = await this.findOne(id, companyId);

    if (payment.status !== PaymentStatus.DRAFT) {
      throw new BadRequestException('Can only submit DRAFT payments');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.ON_APPROVAL },
    });

    await this.prisma.paymentHistory.create({
      data: {
        paymentId: id,
        fromStatus: PaymentStatus.DRAFT,
        toStatus: PaymentStatus.ON_APPROVAL,
        comment: 'Submitted for approval',
        metadata: { userId },
      },
    });

    return updated;
  }

  async sign(id: string, signPaymentDto: SignPaymentDto, companyId: string, userId: string) {
    const payment = await this.findOne(id, companyId);

    if (payment.status !== PaymentStatus.ON_APPROVAL) {
      throw new BadRequestException('Can only sign payments ON_APPROVAL');
    }

    // Create signature
    await this.prisma.paymentSignature.create({
      data: {
        paymentId: id,
        userId,
        signatureType: signPaymentDto.signatureType,
        signatureData: signPaymentDto.signature,
        certThumbprint: signPaymentDto.certThumbprint,
        certChain: signPaymentDto.chain ? JSON.stringify(signPaymentDto.chain) : null,
      },
    });

    // Update payment status to SIGNED
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.SIGNED },
    });

    await this.prisma.paymentHistory.create({
      data: {
        paymentId: id,
        fromStatus: PaymentStatus.ON_APPROVAL,
        toStatus: PaymentStatus.SIGNED,
        comment: 'Payment signed',
        metadata: { userId },
      },
    });

    return updated;
  }

  async send(id: string, companyId: string, userId: string) {
    const payment = await this.findOne(id, companyId);

    if (payment.status !== PaymentStatus.SIGNED) {
      throw new BadRequestException('Can only send SIGNED payments');
    }

    // Update status
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.SENT,
        sentAt: new Date(),
        bankRef: `BANK-${Date.now()}`, // In real system, this comes from bank
      },
    });

    await this.prisma.paymentHistory.create({
      data: {
        paymentId: id,
        fromStatus: PaymentStatus.SIGNED,
        toStatus: PaymentStatus.SENT,
        comment: 'Payment sent to bank',
        metadata: { userId },
      },
    });

    // Bank Emulator service will automatically process this payment
    // (in real system, this would be async via message queue to bank gateway)

    return updated;
  }

  async delete(id: string, companyId: string) {
    const payment = await this.findOne(id, companyId);

    // Can only delete DRAFT
    if (payment.status !== PaymentStatus.DRAFT) {
      throw new BadRequestException('Can only delete DRAFT payments');
    }

    await this.prisma.payment.delete({ where: { id } });

    return { success: true };
  }

  async getHistory(id: string, companyId: string) {
    const payment = await this.findOne(id, companyId);

    return this.prisma.paymentHistory.findMany({
      where: { paymentId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async uploadFile(
    paymentId: string,
    file: Express.Multer.File,
    docType: string,
    userId: string,
    companyId: string,
  ) {
    const payment = await this.findOne(paymentId, companyId);

    // Mock file URL (in production, upload to S3/MinIO)
    const fileUrl = `https://storage.example.com/payments/${paymentId}/${file.originalname}`;

    // Calculate SHA256 hash (simplified for mock)
    const sha256 = Buffer.from(file.originalname).toString('base64').substring(0, 64);

    const paymentFile = await this.prisma.paymentFile.create({
      data: {
        paymentId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl,
        sha256,
        docType: docType as any,
        uploadedBy: userId,
      },
      include: {
        uploader: { select: { id: true, email: true } },
      },
    });

    return paymentFile;
  }

  async getFiles(paymentId: string, companyId: string) {
    const payment = await this.findOne(paymentId, companyId);

    return this.prisma.paymentFile.findMany({
      where: { paymentId },
      include: {
        uploader: { select: { id: true, email: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async deleteFile(fileId: string, companyId: string) {
    const file = await this.prisma.paymentFile.findUnique({
      where: { id: fileId },
      include: { payment: true },
    });

    if (!file || file.payment.companyId !== companyId) {
      throw new NotFoundException('File not found');
    }

    // Can only delete files from DRAFT or ON_APPROVAL payments
    if (!['DRAFT', 'ON_APPROVAL'].includes(file.payment.status)) {
      throw new BadRequestException('Cannot delete files from submitted payments');
    }

    await this.prisma.paymentFile.delete({ where: { id: fileId } });

    return { success: true };
  }
}
