// lib/models/user.model.dart
class UserModel {
  final String id;
  final String email;
  final String name;
  final String? studentId;
  final String? phone;
  final String? bio;
  final String? avatarUrl;
  final String role; // 'STUDENT' | 'ADMIN'
  final bool isVerified;
  final double? avgRating;
  final int? reviewCount;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.studentId,
    this.phone,
    this.bio,
    this.avatarUrl,
    required this.role,
    required this.isVerified,
    this.avgRating,
    this.reviewCount,
  });

  bool get isAdmin => role == 'ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? 'Unknown User',
      studentId: json['studentId'],
      phone: json['phone'],
      bio: json['bio'],
      avatarUrl: json['avatarUrl'],
      role: json['role'] ?? 'STUDENT',
      isVerified: json['isVerified'] ?? false,
      avgRating: json['avgRating']?.toDouble(),
      reviewCount: json['reviewCount'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'email': email, 'name': name,
    'studentId': studentId, 'phone': phone, 'bio': bio,
    'avatarUrl': avatarUrl, 'role': role, 'isVerified': isVerified,
  };
}

// lib/models/listing.model.dart
class ListingModel {
  final String id;
  final String title;
  final String description;
  final double price;
  final String category;
  final String type; // 'PRODUCT' | 'SERVICE'
  final List<String> images;
  final String status;
  final String? condition;
  final String sellerId;
  final UserModel? seller;
  final DateTime createdAt;

  ListingModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.category,
    required this.type,
    required this.images,
    required this.status,
    this.condition,
    required this.sellerId,
    this.seller,
    required this.createdAt,
  });

  factory ListingModel.fromJson(Map<String, dynamic> json) {
    // images dari backend berupa JSON string: '["url1","url2"]'
    // perlu di-decode dulu sebelum dipakai
    List<String> parseImages(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) return List<String>.from(raw);
      if (raw is String) {
        try {
          final decoded = raw
              .replaceAll('[', '')
              .replaceAll(']', '')
              .replaceAll('"', '')
              .trim();
          if (decoded.isEmpty) return [];
          return decoded.split(',').where((s) => s.trim().isNotEmpty).toList();
        } catch (_) {
          return [];
        }
      }
      return [];
    }

    return ListingModel(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Produk Tanpa Judul',
      description: json['description'] ?? 'Tidak ada deskripsi',
      price: json['price'] != null ? double.parse(json['price'].toString()) : 0.0,
      category: json['category'] ?? 'OTHER',
      type: json['type'] ?? 'PRODUCT',
      images: parseImages(json['images']),
      status: json['status'] ?? 'PENDING',
      condition: json['condition'],
      sellerId: json['sellerId'] ?? '',
      seller: json['seller'] != null ? UserModel.fromJson(json['seller']) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING': return 'Menunggu Review';
      case 'ACTIVE': return 'Aktif';
      case 'REJECTED': return 'Ditolak';
      case 'SOLD': return 'Terjual';
      case 'INACTIVE': return 'Nonaktif';
      default: return status;
    }
  }

  String get categoryLabel {
    switch (category) {
      case 'ELECTRONICS': return 'Elektronik';
      case 'BOOKS': return 'Buku';
      case 'FASHION': return 'Fashion';
      case 'FOOD': return 'Makanan';
      case 'SERVICES': return 'Jasa';
      case 'SPORTS': return 'Olahraga';
      default: return 'Lainnya';
    }
  }
}

// lib/models/transaction.model.dart
class TransactionModel {
  final String id;
  final String listingId;
  final Map<String, dynamic>? listing;
  final String buyerId;
  final UserModel? buyer;
  final String sellerId;
  final UserModel? seller;
  final String status;
  final String? note;
  final double price;
  final DateTime createdAt;
  final ReviewModel? review;

  TransactionModel({
    required this.id,
    required this.listingId,
    this.listing,
    required this.buyerId,
    this.buyer,
    required this.sellerId,
    this.seller,
    required this.status,
    this.note,
    required this.price,
    required this.createdAt,
    this.review,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'],
      listingId: json['listingId'],
      listing: json['listing'],
      buyerId: json['buyerId'],
      buyer: json['buyer'] != null ? UserModel.fromJson(json['buyer']) : null,
      sellerId: json['sellerId'],
      seller: json['seller'] != null ? UserModel.fromJson(json['seller']) : null,
      status: json['status'],
      note: json['note'],
      price: double.parse(json['price'].toString()),
      createdAt: DateTime.parse(json['createdAt']),
      review: json['review'] != null ? ReviewModel.fromJson(json['review']) : null,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING': return 'Menunggu Konfirmasi';
      case 'CONFIRMED': return 'Dikonfirmasi';
      case 'COMPLETED': return 'Selesai';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  }

  bool get canReview => status == 'COMPLETED' && review == null;
}

// lib/models/review.model.dart
class ReviewModel {
  final String id;
  final String transactionId;
  final String reviewerId;
  final UserModel? reviewer;
  final int rating;
  final String? comment;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.transactionId,
    required this.reviewerId,
    this.reviewer,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'],
      transactionId: json['transactionId'],
      reviewerId: json['reviewerId'],
      reviewer: json['reviewer'] != null ? UserModel.fromJson(json['reviewer']) : null,
      rating: json['rating'],
      comment: json['comment'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

// lib/models/message.model.dart
class MessageModel {
  final String id;
  final String chatRoomId;
  final String senderId;
  final UserModel? sender;
  final String content;
  final bool isRead;
  final DateTime createdAt;

  MessageModel({
    required this.id,
    required this.chatRoomId,
    required this.senderId,
    this.sender,
    required this.content,
    required this.isRead,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] ?? '',
      chatRoomId: json['chatRoomId'] ?? json['roomId'] ?? '',
      senderId: json['senderId'] ?? '',
      sender: json['sender'] != null ? UserModel.fromJson(json['sender']) : null,
      content: json['content'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}

// lib/models/chat_room.model.dart
class ChatRoomModel {
  final String id;
  final UserModel? userA;
  final UserModel? userB;
  final List<MessageModel> messages;
  final int unreadCount;

  ChatRoomModel({
    required this.id,
    this.userA,
    this.userB,
    required this.messages,
    required this.unreadCount,
  });

  factory ChatRoomModel.fromJson(Map<String, dynamic> json) {
    return ChatRoomModel(
      id: json['id'],
      userA: json['userA'] != null ? UserModel.fromJson(json['userA']) : null,
      userB: json['userB'] != null ? UserModel.fromJson(json['userB']) : null,
      messages: (json['messages'] as List? ?? [])
          .map((m) => MessageModel.fromJson(m))
          .toList(),
      unreadCount: json['unreadCount'] ?? 0,
    );
  }

  MessageModel? get lastMessage => messages.isNotEmpty ? messages.last : null;

  UserModel? otherUser(String myId) => userA?.id == myId ? userB : userA;
}
