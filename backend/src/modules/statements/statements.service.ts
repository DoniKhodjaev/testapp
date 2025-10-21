import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateStatementDto } from './dto/generate-statement.dto';
import * as PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

@Injectable()
export class StatementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, filters?: any) {
    const where: any = {};

    // Get all accounts for this company
    const accounts = await this.prisma.account.findMany({
      where: { companyId },
      select: { id: true },
    });

    where.accountId = { in: accounts.map((a) => a.id) };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.from) {
      where.dateFrom = { gte: new Date(filters.from) };
    }

    if (filters.to) {
      where.dateTo = { lte: new Date(filters.to) };
    }

    return this.prisma.statement.findMany({
      where,
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const statement = await this.prisma.statement.findFirst({
      where: {
        id,
        account: { companyId },
      },
      include: { account: true },
    });

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return statement;
  }

  /**
   * Generate statement data for given account and date range
   */
  async generateStatementData(dto: GenerateStatementDto, companyId: string) {
    // Verify account belongs to company
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, companyId },
      include: { company: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Get all payments for this account in the date range
    const payments = await this.prisma.payment.findMany({
      where: {
        accountId: dto.accountId,
        date: {
          gte: new Date(dto.dateFrom),
          lte: new Date(dto.dateTo),
        },
        status: { in: ['POSTED', 'BANK_ACCEPTED', 'SENT', 'SIGNED'] },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate totals
    const totalDebit = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const openingBalance = Number(account.balance) + totalDebit; // Simplified
    const closingBalance = Number(account.balance);

    // Create statement record
    const statement = await this.prisma.statement.create({
      data: {
        accountId: dto.accountId,
        dateFrom: new Date(dto.dateFrom),
        dateTo: new Date(dto.dateTo),
        metaJson: {
          openingBalance,
          closingBalance,
          totalDebit,
          totalCredit: 0,
          transactionCount: payments.length,
        },
      },
    });

    return {
      statement,
      account,
      payments,
      openingBalance,
      closingBalance,
      totalDebit,
    };
  }

  /**
   * Generate PDF statement
   */
  async generatePDF(id: string, companyId: string): Promise<Buffer> {
    const statement = await this.findOne(id, companyId);

    // Get payments for this statement
    const payments = await this.prisma.payment.findMany({
      where: {
        accountId: statement.accountId,
        date: {
          gte: statement.dateFrom,
          lte: statement.dateTo,
        },
        status: { in: ['POSTED', 'BANK_ACCEPTED', 'SENT', 'SIGNED'] },
      },
      orderBy: { date: 'asc' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Выписка по счету', { align: 'center' });
      doc.moveDown();

      // Account details
      doc.fontSize(12);
      doc.text(`Счет: ${statement.account.accountNo}`);
      doc.text(`Организация: ${statement.account.company?.name || 'N/A'}`);
      doc.text(
        `Период: ${this.formatDate(statement.dateFrom)} - ${this.formatDate(statement.dateTo)}`,
      );
      doc.moveDown();

      // Balances
      const meta: any = statement.metaJson || {};
      doc.text(`Входящий остаток: ${this.formatAmount(meta.openingBalance)} ${statement.account.currency}`);
      doc.text(`Исходящий остаток: ${this.formatAmount(meta.closingBalance)} ${statement.account.currency}`);
      doc.text(`Обороты по дебету: ${this.formatAmount(meta.totalDebit)} ${statement.account.currency}`);
      doc.moveDown(2);

      // Transactions table
      if (payments.length > 0) {
        doc.fontSize(14).text('Операции:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);

        payments.forEach((payment, index) => {
          doc.text(`${index + 1}. ${this.formatDate(payment.date)}`);
          doc.text(`   Сумма: ${this.formatAmount(payment.amount)} ${payment.currency}`);
          doc.text(`   Получатель: ${payment.receiverName} (ИНН ${payment.receiverInn})`);
          doc.text(`   Назначение: ${payment.purpose}`);
          doc.text(`   Статус: ${payment.status}`);
          doc.moveDown(0.5);
        });
      } else {
        doc.text('Операций не найдено');
      }

      doc.end();
    });
  }

  /**
   * Generate XLSX statement
   */
  async generateXLSX(id: string, companyId: string): Promise<Buffer> {
    const statement = await this.findOne(id, companyId);

    // Get payments for this statement
    const payments = await this.prisma.payment.findMany({
      where: {
        accountId: statement.accountId,
        date: {
          gte: statement.dateFrom,
          lte: statement.dateTo,
        },
        status: { in: ['POSTED', 'BANK_ACCEPTED', 'SENT', 'SIGNED'] },
      },
      orderBy: { date: 'asc' },
    });

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['Выписка по счету'],
      [''],
      ['Счет', statement.account.accountNo],
      ['Организация', statement.account.company?.name || 'N/A'],
      [
        'Период',
        `${this.formatDate(statement.dateFrom)} - ${this.formatDate(statement.dateTo)}`,
      ],
      [''],
      ['Входящий остаток', (statement.metaJson as any)?.openingBalance || 0],
      ['Исходящий остаток', (statement.metaJson as any)?.closingBalance || 0],
      ['Обороты по дебету', (statement.metaJson as any)?.totalDebit || 0],
      ['Количество операций', payments.length],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

    // Sheet 2: Transactions
    if (payments.length > 0) {
      const transactionData = [
        [
          '№',
          'Дата',
          'Сумма',
          'Валюта',
          'Получатель',
          'ИНН получателя',
          'БИК',
          'Счет',
          'Назначение',
          'Статус',
        ],
        ...payments.map((payment, index) => [
          index + 1,
          this.formatDate(payment.date),
          Number(payment.amount),
          payment.currency,
          payment.receiverName,
          payment.receiverInn,
          payment.receiverBic,
          payment.receiverAccount,
          payment.purpose,
          payment.status,
        ]),
      ];

      const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Операции');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  private formatAmount(amount: number | string): string {
    return Number(amount).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
