// src/services/chat.service.ts
// Business logic untuk Chat

import { ChatRepository } from '../repositories/chat.repository';
import { UserRepository } from '../repositories/user.repository';

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Ambil semua chat rooms milik user
   */
  async getMyChatRooms(userId: string) {
    return this.chatRepository.findRoomsByUserId(userId);
  }

  /**
   * Buka atau buat chat room dengan user lain
   * Business rules:
   * - Tidak bisa chat dengan diri sendiri
   * - User lain harus ada
   */
  async getOrCreateRoom(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new Error('Tidak bisa chat dengan diri sendiri.');
    }

    const otherUser = await this.userRepository.findById(otherUserId);
    if (!otherUser) throw new Error('User tidak ditemukan.');

    return this.chatRepository.findOrCreateRoom(userId, otherUserId);
  }

  /**
   * Ambil pesan dalam satu room
   * Business rule: Hanya anggota room yang bisa melihat pesan
   */
  async getRoomMessages(roomId: string, userId: string, page = 1, limit = 50) {
    const room = await this.chatRepository.findRoomById(roomId);
    if (!room) throw new Error('Chat room tidak ditemukan.');

    if (room.userAId !== userId && room.userBId !== userId) {
      throw new Error('Akses ditolak.');
    }

    const messages = await this.chatRepository.findMessages(roomId, page, limit);

    // Tandai pesan sebagai sudah dibaca
    await this.chatRepository.markMessagesAsRead(roomId, userId);

    return messages;
  }
}
