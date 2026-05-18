// lib/screens/student/listing_detail_screen.dart
// Detail produk + tombol Beli & Chat

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/format_utils.dart';
import 'chat_room_screen.dart';

class ListingDetailScreen extends StatefulWidget {
  final ListingModel listing;
  const ListingDetailScreen({super.key, required this.listing});

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  bool _isOrdering = false;

  Future<void> _buyNow() async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BuyBottomSheet(listing: widget.listing),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _isOrdering = true);
    try {
      await ApiService.createTransaction(widget.listing.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Permintaan berhasil dikirim ke seller!'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _isOrdering = false);
    }
  }

  Future<void> _openChat() async {
    try {
      final res = await ApiService.getOrCreateChatRoom(widget.listing.sellerId);
      final roomId = res['data']['id'];
      final otherUser = UserModel.fromJson(res['data']['userA']['id'] == context.read<AuthProvider>().user!.id
          ? res['data']['userB']
          : res['data']['userA']);
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ChatRoomScreen(roomId: roomId, otherUser: otherUser)),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gagal membuka chat')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.listing;
    final myId = context.read<AuthProvider>().user?.id;
    final isMyListing = listing.sellerId == myId;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Image / Header ────────────────────
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: listing.images.isNotEmpty
                  ? Image.network(listing.images.first, fit: BoxFit.cover)
                  : Container(
                      decoration: AppDecorations.blueGradient,
                      child: const Center(
                        child: Icon(Icons.image_outlined, size: 72, color: Colors.white54),
                      ),
                    ),
            ),
          ),

          // ── Content ───────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type & Category badges
                      Row(
                        children: [
                          _Badge(
                            label: listing.type == 'SERVICE' ? 'Jasa' : 'Produk',
                            color: listing.type == 'SERVICE' ? AppColors.info : AppColors.primary,
                          ),
                          const SizedBox(width: 8),
                          _Badge(label: listing.categoryLabel, color: AppColors.grey600),
                          if (listing.condition != null) ...[
                            const SizedBox(width: 8),
                            _Badge(label: _conditionLabel(listing.condition!), color: AppColors.success),
                          ],
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Title
                      Text(listing.title, style: Theme.of(context).textTheme.headlineSmall),
                      const SizedBox(height: 8),

                      // Price
                      Text(
                        FormatUtils.currency(listing.price),
                        style: const TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),

                      const SizedBox(height: 20),
                      const Divider(),
                      const SizedBox(height: 16),

                      // Seller info
                      if (listing.seller != null) ...[
                        Text('Penjual', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: AppColors.primaryLighter,
                              child: listing.seller!.avatarUrl != null
                                  ? ClipOval(child: Image.network(listing.seller!.avatarUrl!))
                                  : Text(
                                      listing.seller!.name[0].toUpperCase(),
                                      style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700, color: AppColors.primary),
                                    ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(listing.seller!.name, style: Theme.of(context).textTheme.titleMedium),
                                      if (listing.seller!.isVerified) ...[
                                        const SizedBox(width: 4),
                                        const Icon(Icons.verified_rounded, size: 16, color: AppColors.primary),
                                      ],
                                    ],
                                  ),
                                  Text('Mahasiswa BINUS', style: Theme.of(context).textTheme.bodySmall),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 20),
                        const Divider(),
                        const SizedBox(height: 16),
                      ],

                      // Description
                      Text('Deskripsi', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text(listing.description, style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.6)),
                      const SizedBox(height: 20),

                      // Posted date
                      Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            'Diposting ${FormatUtils.timeAgo(listing.createdAt)}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 100), // Space for bottom bar
              ],
            ),
          ),
        ],
      ),

      // ── Bottom Action Bar ─────────────────────
      bottomNavigationBar: !isMyListing
          ? Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              decoration: BoxDecoration(
                color: AppColors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, -4))],
              ),
              child: Row(
                children: [
                  // Chat button
                  OutlinedButton.icon(
                    onPressed: _openChat,
                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                    label: const Text('Chat'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Buy button
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isOrdering ? null : _buyNow,
                      icon: _isOrdering
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.shopping_bag_outlined, size: 18),
                      label: Text(_isOrdering ? 'Memproses...' : 'Beli Sekarang'),
                    ),
                  ),
                ],
              ),
            )
          : null,
    );
  }

  String _conditionLabel(String c) {
    switch (c) {
      case 'NEW': return 'Baru';
      case 'LIKE_NEW': return 'Seperti Baru';
      case 'GOOD': return 'Baik';
      case 'FAIR': return 'Cukup';
      default: return c;
    }
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontFamily: 'Poppins', fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

// Bottom Sheet konfirmasi beli
class _BuyBottomSheet extends StatefulWidget {
  final ListingModel listing;
  const _BuyBottomSheet({required this.listing});

  @override
  State<_BuyBottomSheet> createState() => _BuyBottomSheetState();
}

class _BuyBottomSheetState extends State<_BuyBottomSheet> {
  final _noteCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.grey300, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 20),
          Text('Konfirmasi Pembelian', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(widget.listing.title, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
              Text(FormatUtils.currency(widget.listing.price), style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _noteCtrl,
            maxLines: 2,
            decoration: const InputDecoration(
              labelText: 'Catatan untuk seller (opsional)',
              hintText: 'Tulis pertanyaan atau catatan...',
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Kirim Permintaan'),
            ),
          ),
        ],
      ),
    );
  }
}
