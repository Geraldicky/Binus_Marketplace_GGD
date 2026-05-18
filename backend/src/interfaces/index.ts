// src/interfaces/transaction.interface.ts

import { TransactionStatus } from '@prisma/client';

export interface CreateTransactionDto {
  listingId: string;
  note?: string;
}

export interface UpdateTransactionStatusDto {
  status: TransactionStatus;
}

// ─────────────────────────────────────────────

// src/interfaces/review.interface.ts

export interface CreateReviewDto {
  transactionId: string;
  rating: number;
  comment?: string;
}

// ─────────────────────────────────────────────

// src/interfaces/chat.interface.ts

export interface CreateChatRoomDto {
  otherUserId: string;
}

export interface ChatRoomWithUsers {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: Date;
  userA: { id: string; name: string; avatarUrl: string | null };
  userB: { id: string; name: string; avatarUrl: string | null };
  messages: {
    id: string;
    content: string;
    senderId: string;
    isRead: boolean;
    createdAt: Date;
  }[];
  unreadCount?: number;
}

// ─────────────────────────────────────────────

// src/interfaces/user.interface.ts

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────────

// src/interfaces/complaint.interface.ts

import { ComplaintTarget } from '@prisma/client';

export interface CreateComplaintDto {
  targetType: ComplaintTarget;
  targetId: string;
  reason: string;
  description?: string;
}

export interface UpdateComplaintDto {
  status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  adminNote?: string;
}

// ─────────────────────────────────────────────

// src/interfaces/admin.interface.ts

export interface ModerateListingDto {
  action: 'approve' | 'reject';
  adminNote?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  totalTransactions: number;
  openComplaints: number;
}

// ─────────────────────────────────────────────

// src/interfaces/pagination.interface.ts

export interface PaginationDto {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
