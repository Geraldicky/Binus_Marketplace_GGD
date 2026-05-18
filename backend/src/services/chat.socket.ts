// src/services/chat.socket.ts
// Real-time chat dengan Socket.io + TypeScript

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatRepository } from '../repositories/chat.repository';
import { JwtPayload } from '../interfaces/auth.interface';
import prisma from '../lib/prisma';

interface SocketWithUser extends Socket {
  user: { id: string; name: string; avatarUrl: string | null };
}

export const initChatSocket = (io: Server): void => {
  const chatRepository = new ChatRepository();

  // Middleware autentikasi Socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) return next(new Error('Token tidak ditemukan'));

      const secret = process.env.JWT_SECRET;
      if (!secret) return next(new Error('Server error'));

      const decoded = jwt.verify(token, secret) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, avatarUrl: true },
      });

      if (!user) return next(new Error('User tidak ditemukan'));

      (socket as SocketWithUser).user = user;
      next();
    } catch {
      next(new Error('Token tidak valid'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const s = socket as SocketWithUser;
    console.log(`✅ Socket connected: ${s.user.name} (${s.id})`);

    // Masuk ke room
    s.on('join_room', (roomId: string) => {
      s.join(roomId);
      console.log(`${s.user.name} joined room: ${roomId}`);
    });

    // Keluar dari room
    s.on('leave_room', (roomId: string) => {
      s.leave(roomId);
    });

    // Kirim pesan
    s.on('send_message', async (payload: { roomId: string; content: string }) => {
      try {
        const { roomId, content } = payload;
        if (!content?.trim()) return;

        // Verifikasi user adalah anggota room
        const room = await chatRepository.findRoomById(roomId);
        if (!room) {
          s.emit('error', { message: 'Room tidak ditemukan.' });
          return;
        }

        const isMember = room.userAId === s.user.id || room.userBId === s.user.id;
        if (!isMember) {
          s.emit('error', { message: 'Akses ditolak.' });
          return;
        }

        // Simpan pesan ke database via repository
        const message = await chatRepository.createMessage({
          chatRoomId: roomId,
          senderId: s.user.id,
          content: content.trim(),
        });

        // Broadcast ke semua yang ada di room (termasuk pengirim)
        io.to(roomId).emit('new_message', message);
      } catch (err) {
        console.error('send_message error:', err);
        s.emit('error', { message: 'Gagal mengirim pesan.' });
      }
    });

    // Typing indicator
    s.on('typing', (payload: { roomId: string; isTyping: boolean }) => {
      s.to(payload.roomId).emit('user_typing', {
        userId: s.user.id,
        name: s.user.name,
        isTyping: payload.isTyping,
      });
    });

    s.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${s.user.name}`);
    });
  });
};
