import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentValidationService } from './payment-validation.service';
import { PaymentStatus } from '@prisma/client';
import * as XLSX from 'xlsx';

interface ImportRow {
  row: number;
  account: string;
  date: string;
  amount: string;
  currency: string;
  receiverName: string;
  receiverInn: string;
  receiverKpp?: string;
  receiverAccount: string;
  receiverBic: string;
  purpose: string;
  kbk?: string;
  oktmo?: string;
  uip?: string;
}

interface ImportError {
  row: number;
  field: string;
  code: string;
  message: string;
}

interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  errors: ImportError[];
  created: number;
}

@Injectable()
export class PaymentsImportService {
  constructor(
    private prisma: PrismaService,
    private validationService: PaymentValidationService,
  ) {}

  async importFromFile(
    file: Express.Multer.File,
    companyId: string,
    userId: string,
  ): Promise<ImportResult> {
    const rows = this.parseFile(file);

    const result: ImportResult = {
      total: rows.length,
      valid: 0,
      invalid: 0,
      errors: [],
      created: 0,
    };

    // Validate all rows first
    const validRows: ImportRow[] = [];

    for (const row of rows) {
      const rowErrors = await this.validateRow(row, companyId);

      if (rowErrors.length > 0) {
        result.invalid++;
        result.errors.push(...rowErrors);
      } else {
        result.valid++;
        validRows.push(row);
      }
    }

    // Create payments for valid rows
    for (const row of validRows) {
      try {
        await this.createPaymentFromRow(row, companyId, userId);
        result.created++;
      } catch (error) {
        result.errors.push({
          row: row.row,
          field: 'general',
          code: 'CREATE_ERROR',
          message: error.message,
        });
        result.created--;
        result.invalid++;
      }
    }

    return result;
  }

  private parseFile(file: Express.Multer.File): ImportRow[] {
    const rows: ImportRow[] = [];

    if (file.mimetype === 'text/csv') {
      // Parse CSV
      const content = file.buffer.toString('utf-8');
      const lines = content.split('\n');

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = this.parseCSVLine(line);
        rows.push(this.mapRowData(cells, i + 1));
      }
    } else {
      // Parse XLSX
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      // Skip header
      for (let i = 1; i < data.length; i++) {
        if (!data[i] || data[i].length === 0) continue;
        rows.push(this.mapRowData(data[i], i + 1));
      }
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  }

  private mapRowData(cells: any[], rowNumber: number): ImportRow {
    return {
      row: rowNumber,
      account: String(cells[0] || '').trim(),
      date: String(cells[1] || '').trim(),
      amount: String(cells[2] || '').trim(),
      currency: String(cells[3] || 'RUB').trim(),
      receiverName: String(cells[4] || '').trim(),
      receiverInn: String(cells[5] || '').trim(),
      receiverKpp: cells[6] ? String(cells[6]).trim() : undefined,
      receiverAccount: String(cells[7] || '').trim(),
      receiverBic: String(cells[8] || '').trim(),
      purpose: String(cells[9] || '').trim(),
      kbk: cells[10] ? String(cells[10]).trim() : undefined,
      oktmo: cells[11] ? String(cells[11]).trim() : undefined,
      uip: cells[12] ? String(cells[12]).trim() : undefined,
    };
  }

  private async validateRow(row: ImportRow, companyId: string): Promise<ImportError[]> {
    const errors: ImportError[] = [];

    // Find account
    const account = await this.prisma.account.findFirst({
      where: { companyId, accountNo: row.account.replace(/\s/g, '') },
    });

    if (!account) {
      errors.push({
        row: row.row,
        field: 'account',
        code: 'NOT_FOUND',
        message: 'Счет не найден',
      });
    }

    // Validate date
    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      errors.push({
        row: row.row,
        field: 'date',
        code: 'INVALID_DATE',
        message: 'Неверный формат даты (ожидается YYYY-MM-DD)',
      });
    }

    // Validate amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push({
        row: row.row,
        field: 'amount',
        code: 'INVALID_AMOUNT',
        message: 'Неверная сумма',
      });
    }

    // Validate payment data using existing service
    const validationErrors = await this.validationService.validate({
      receiver: {
        name: row.receiverName,
        inn: row.receiverInn,
        kpp: row.receiverKpp,
        accountNo: row.receiverAccount,
        bic: row.receiverBic,
      },
      amount,
      purpose: row.purpose,
      budget: {
        kbk: row.kbk,
        oktmo: row.oktmo,
        uip: row.uip,
      },
    });

    for (const err of validationErrors) {
      errors.push({
        row: row.row,
        field: err.field,
        code: err.code,
        message: err.message,
      });
    }

    return errors;
  }

  private async createPaymentFromRow(row: ImportRow, companyId: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { companyId, accountNo: row.account.replace(/\s/g, '') },
    });

    return this.prisma.payment.create({
      data: {
        companyId,
        accountId: account.id,
        date: new Date(row.date),
        amount: parseFloat(row.amount),
        currency: row.currency,
        receiverName: row.receiverName,
        receiverInn: row.receiverInn,
        receiverKpp: row.receiverKpp,
        receiverAccount: row.receiverAccount.replace(/\s/g, ''),
        receiverBic: row.receiverBic,
        purpose: row.purpose,
        kbk: row.kbk,
        oktmo: row.oktmo,
        uip: row.uip,
        priority: 5,
        status: PaymentStatus.DRAFT,
        createdBy: userId,
      },
    });
  }
}
