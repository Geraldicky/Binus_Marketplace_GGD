// src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { ReviewRepository } from '../repositories/review.repository';
import { authenticate } from '../middleware/auth.middleware';

const userRepository = new UserRepository();
const reviewRepository = new ReviewRepository();
const userService = new UserService(userRepository, reviewRepository);
const userController = new UserController(userService);

const router = Router();
router.get('/:id', authenticate, userController.getPublicProfile);
router.put('/me', authenticate, userController.updateProfile);
router.put('/me/password', authenticate, userController.changePassword);

export default router;
