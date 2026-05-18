// src/routes/chat.routes.ts
import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/chat.service';
import { ChatRepository } from '../repositories/chat.repository';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middleware/auth.middleware';

const chatRepository = new ChatRepository();
const userRepository = new UserRepository();
const chatService = new ChatService(chatRepository, userRepository);
const chatController = new ChatController(chatService);

const router = Router();
router.get('/rooms', authenticate, chatController.getMyChatRooms);
router.post('/rooms', authenticate, chatController.getOrCreateRoom);
router.get('/rooms/:roomId/messages', authenticate, chatController.getRoomMessages);

export default router;
