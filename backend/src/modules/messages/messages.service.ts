import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, filters?: any) {
    const where: any = { companyId };

    if (filters.unread === 'true') {
      where.isRead = false;
    }
    if (filters.type) {
      where.threadType = filters.type;
    }

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string, companyId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, companyId },
    });

    if (message && !message.isRead) {
      await this.prisma.message.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return message;
  }

  async reply(id: string, body: string, userId: string, companyId: string) {
    return this.prisma.message.update({
      where: { id },
      data: {
        repliedBy: userId,
        repliedAt: new Date(),
      },
    });
  }
}
