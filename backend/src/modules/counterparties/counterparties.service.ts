import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CounterpartiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query?: string) {
    const where: any = { companyId };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { inn: { contains: query } },
      ];
    }

    return this.prisma.counterparty.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any, companyId: string) {
    return this.prisma.counterparty.create({
      data: {
        companyId,
        ...data,
      },
    });
  }
}
