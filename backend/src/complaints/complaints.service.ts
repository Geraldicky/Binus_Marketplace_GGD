// src/complaints/complaints.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateComplaintDto) {
    return this.prisma.complaint.create({
      data: { reporterId, ...dto },
    });
  }

  async findAll(status?: string) {
    return this.prisma.complaint.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateStatus(id: string, status: string, adminNote?: string) {
    return this.prisma.complaint.update({
      where: { id },
      data: { status: status as any, ...(adminNote && { adminNote }) },
    });
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.complaint.count({ where: { status: status as any } });
  }
}
