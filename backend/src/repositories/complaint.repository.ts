// src/repositories/complaint.repository.ts

import { ComplaintStatus, ComplaintTarget } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ComplaintRepository extends BaseRepository {

  async create(data: {
    reporterId: string;
    targetType: ComplaintTarget;
    targetId: string;
    reason: string;
    description?: string;
  }) {
    return this.db.complaint.create({ data });
  }

  async findAll(status?: ComplaintStatus) {
    return this.db.complaint.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    return this.db.complaint.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: ComplaintStatus, adminNote?: string) {
    return this.db.complaint.update({
      where: { id },
      data: { status, ...(adminNote && { adminNote }) },
    });
  }

  async countByStatus(status: ComplaintStatus): Promise<number> {
    return this.db.complaint.count({ where: { status } });
  }
}
