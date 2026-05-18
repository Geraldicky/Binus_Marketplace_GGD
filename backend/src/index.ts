// src/index.ts
// =============================================
// BINUS Marketplace — Server Entry Point
// =============================================

import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listing.routes';
import transactionRoutes from './routes/transaction.routes';
import reviewRoutes from './routes/review.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import complaintRoutes from './routes/complaint.routes';
import adminRoutes from './routes/admin.routes';

// Socket.io
import { initChatSocket } from './services/chat.socket';

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// Socket.io (Real-time Chat)
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
  },
});

initChatSocket(io);

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'BINUS Marketplace API is running (TypeScript)' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan.' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal Server Error.' });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
  console.log(`🚀 BINUS Marketplace API  →  http://localhost:${PORT}`);
  console.log(`📡 Socket.io              →  real-time chat aktif`);
  console.log(`🌿 Environment            →  ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`🗄️  Database               →  ${process.env.DATABASE_URL?.split('@')[1] ?? 'MySQL'}`);
});
