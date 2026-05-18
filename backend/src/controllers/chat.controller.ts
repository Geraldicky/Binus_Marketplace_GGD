// src/controllers/chat.controller.ts

import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { ResponseHelper } from '../lib/response';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** GET /api/chat/rooms */
  getMyChatRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const rooms = await this.chatService.getMyChatRooms(userId);
      ResponseHelper.success(res, rooms);
    } catch (error) {
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Terjadi kesalahan server.');
    }
  };

  /** POST /api/chat/rooms */
  getOrCreateRoom = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { otherUserId } = req.body;

      if (!otherUserId) {
        ResponseHelper.badRequest(res, 'otherUserId wajib diisi.');
        return;
      }

      const room = await this.chatService.getOrCreateRoom(userId, otherUserId);
      ResponseHelper.success(res, room);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404 : 400;
      ResponseHelper.error(res, message, code);
    }
  };

  /** GET /api/chat/rooms/:roomId/messages */
  getRoomMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { roomId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await this.chatService.getRoomMessages(roomId, userId, page, limit);
      ResponseHelper.success(res, messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
      const code = message.includes('tidak ditemukan') ? 404
        : message.includes('ditolak') ? 403 : 500;
      ResponseHelper.error(res, message, code);
    }
  };
}
