import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        mfaEnabled: true,
        isActive: true,
        isBlocked: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string, companyId: string) {
    return this.prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        mfaEnabled: true,
        isActive: true,
        isBlocked: true,
        lastLoginAt: true,
        createdAt: true,
        limitsJson: true,
      },
    });
  }

  async create(data: any, companyId: string) {
    const passwordHash = await argon2.hash(data.password);

    return this.prisma.user.create({
      data: {
        companyId,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        permissions: data.permissions || [],
        limitsJson: data.limits,
      },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
      },
    });
  }

  async update(id: string, data: any, companyId: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.permissions && { permissions: data.permissions }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked }),
        ...(data.limits && { limitsJson: data.limits }),
      },
    });
  }

  async resetMfa(id: string, companyId: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });
  }
}
