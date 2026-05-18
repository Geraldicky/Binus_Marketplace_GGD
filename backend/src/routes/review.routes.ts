// src/routes/review.routes.ts
import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { ReviewService } from '../services/review.service';
import { ReviewRepository } from '../repositories/review.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { authenticate } from '../middleware/auth.middleware';

const reviewRepository = new ReviewRepository();
const transactionRepository = new TransactionRepository();
const reviewService = new ReviewService(reviewRepository, transactionRepository);
const reviewController = new ReviewController(reviewService);

const router = Router();
router.post('/', authenticate, reviewController.create);
router.get('/user/:userId', authenticate, reviewController.getUserReviews);

export default router;
