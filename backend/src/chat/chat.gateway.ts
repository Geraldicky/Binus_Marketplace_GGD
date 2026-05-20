// src/chat/chat.gateway.ts
// =============================================
// Di NestJS, Socket.io diimplementasikan dengan
// @WebSocketGateway decorator, menggantikan
// setup manual di Express index.ts
// =============================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

interface SocketWithUser extends Socket {
  user?: { id: string; name: string; avatarUrl: string | null };
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private chatService: ChatService,
  ) {}

  // Dipanggil otomatis saat client connect
  async handleConnection(client: SocketWithUser) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token) as { userId: string };
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, avatarUrl: true },
      });
      if (!user) { client.disconnect(); return; }

      client.user = user;
      console.log(`✅ Socket connected: ${user.name} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  // Dipanggil otomatis saat client disconnect
  handleDisconnect(client: SocketWithUser) {
    console.log(`❌ Socket disconnected: ${client.user?.name ?? client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: SocketWithUser, @MessageBody() roomId: string) {
    client.join(roomId);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: SocketWithUser, @MessageBody() roomId: string) {
    client.leave(roomId);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { roomId: string; content: string },
  ) {
    if (!client.user || !payload.content?.trim()) return;

    const room = await this.prisma.chatRoom.findUnique({ where: { id: payload.roomId } });
    if (!room) { client.emit('error', { message: 'Room tidak ditemukan.' }); return; }

    const isMember = room.userAId === client.user.id || room.userBId === client.user.id;
    if (!isMember) { client.emit('error', { message: 'Akses ditolak.' }); return; }

    // Pastikan sender sudah join room
    client.join(payload.roomId);

    const message = await this.prisma.message.create({
      data: { chatRoomId: payload.roomId, senderId: client.user.id, content: payload.content.trim() },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Broadcast ke semua member room (termasuk pengirim)
    this.server.to(payload.roomId).emit('new_message', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { roomId: string; isTyping: boolean },
  ) {
    if (!client.user) return;
    client.to(payload.roomId).emit('user_typing', {
      userId: client.user.id,
      name: client.user.name,
      isTyping: payload.isTyping,
    });
  }
}
