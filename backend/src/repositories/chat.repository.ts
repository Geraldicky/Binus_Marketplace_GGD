// src/repositories/chat.repository.ts

import { BaseRepository } from './base.repository';

const userSelect = { id: true, name: true, avatarUrl: true } as const;

export class ChatRepository extends BaseRepository {

  /**
   * Ambil semua chat room milik user, dengan pesan terakhir
   */
  async findRoomsByUserId(userId: string) {
    const rooms = await this.db.chatRoom.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Hitung unread per room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await this.db.message.count({
          where: { chatRoomId: room.id, isRead: false, senderId: { not: userId } },
        });
        return { ...room, unreadCount };
      }),
    );

    return roomsWithUnread;
  }

  /**
   * Cari atau buat chat room.
   * FIX: Enforce userAId < userBId (sort) agar tidak duplikat room.
   */
  async findOrCreateRoom(userIdA: string, userIdB: string) {
    // Sort ID agar urutan selalu konsisten (A < B)
    const [userAId, userBId] = [userIdA, userIdB].sort();

    const existing = await this.db.chatRoom.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
      },
    });

    if (existing) return existing;

    return this.db.chatRoom.create({
      data: { userAId, userBId },
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
      },
    });
  }

  /**
   * Cari room berdasarkan ID
   */
  async findRoomById(id: string) {
    return this.db.chatRoom.findUnique({ where: { id } });
  }

  /**
   * Ambil pesan dalam satu room (dengan pagination)
   */
  async findMessages(roomId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.db.message.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: { sender: { select: userSelect } },
    });
  }

  /**
   * Buat pesan baru
   */
  async createMessage(data: { chatRoomId: string; senderId: string; content: string }) {
    return this.db.message.create({
      data,
      include: { sender: { select: userSelect } },
    });
  }

  /**
   * Tandai semua pesan dalam room sebagai sudah dibaca
   */
  async markMessagesAsRead(roomId: string, readerId: string) {
    return this.db.message.updateMany({
      where: { chatRoomId: roomId, senderId: { not: readerId }, isRead: false },
      data: { isRead: true },
    });
  }
}
