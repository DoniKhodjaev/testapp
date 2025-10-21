import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { accountNo: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    return this.prisma.account.findFirst({
      where: { id, companyId },
    });
  }

  async getStatements(accountId: string, companyId: string, from: Date, to: Date) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return this.prisma.statement.findMany({
      where: {
        accountId,
        dateFrom: { gte: from },
        dateTo: { lte: to },
      },
      orderBy: { dateFrom: 'desc' },
    });
  }

  async generateStatement(accountId: string, companyId: string, from: Date, to: Date) {
    // In real system, this would generate actual statement
    const statement = await this.prisma.statement.create({
      data: {
        accountId,
        dateFrom: from,
        dateTo: to,
        fileUrl: `/statements/${accountId}-${Date.now()}.pdf`,
        sha256: 'mock-hash',
        metaJson: {
          generated: new Date(),
        },
      },
    });

    return statement;
  }
}
