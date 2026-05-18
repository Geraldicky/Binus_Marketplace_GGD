// src/services/complaint.service.ts
// Business logic untuk Complaint

import { ComplaintRepository } from '../repositories/complaint.repository';
import { CreateComplaintDto } from '../interfaces/index';

export class ComplaintService {
  constructor(private readonly complaintRepository: ComplaintRepository) {}

  async create(reporterId: string, data: CreateComplaintDto) {
    if (!data.targetType || !data.targetId || !data.reason) {
      throw new Error('targetType, targetId, dan reason wajib diisi.');
    }
    return this.complaintRepository.create({ reporterId, ...data });
  }

  async getAll(status?: string) {
    return this.complaintRepository.findAll(status as any);
  }
}
