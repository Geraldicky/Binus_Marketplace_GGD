// src/routes/complaint.routes.ts
import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { ComplaintService } from '../services/complaint.service';
import { ComplaintRepository } from '../repositories/complaint.repository';
import { authenticate } from '../middleware/auth.middleware';

const complaintRepository = new ComplaintRepository();
const complaintService = new ComplaintService(complaintRepository);
const complaintController = new ComplaintController(complaintService);

const router = Router();
router.post('/', authenticate, complaintController.create);

export default router;
