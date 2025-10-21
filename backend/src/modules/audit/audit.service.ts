import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, filters?: any) {
    const where: any = { companyId };

    if (filters.from) {
      where.createdAt = { gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.to) };
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.objectType) {
      where.objectType = filters.objectType;
    }
    if (filters.result) {
      where.result = filters.result;
    }

    const limit = parseInt(filters.take) || 100;
    const skip = parseInt(filters.skip) || 0;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }
}
