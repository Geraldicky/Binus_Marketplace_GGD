// src/routes/transaction.routes.ts
import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { TransactionService } from '../services/transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { authenticate } from '../middleware/auth.middleware';

const transactionRepository = new TransactionRepository();
const listingRepository = new ListingRepository();
const transactionService = new TransactionService(transactionRepository, listingRepository);
const transactionController = new TransactionController(transactionService);

const router = Router();
router.get('/', authenticate, transactionController.getMyTransactions);
router.get('/:id', authenticate, transactionController.getById);
router.post('/', authenticate, transactionController.create);
router.patch('/:id/status', authenticate, transactionController.updateStatus);

export default router;
