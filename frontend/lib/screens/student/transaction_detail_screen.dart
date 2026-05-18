// lib/screens/student/transaction_detail_screen.dart
// UC-004: Detail Transaksi + UC-005: Review

import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/format_utils.dart';

class TransactionDetailScreen extends StatefulWidget {
  final TransactionModel transaction;
  final bool isBuyer;
  final VoidCallback onUpdate;

  const TransactionDetailScreen({super.key, required this.transaction, required this.isBuyer, required this.onUpdate});

  @override
  State<TransactionDetailScreen> createState() => _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  late TransactionModel _transaction;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _transaction = widget.transaction;
  }

  Future<void> _updateStatus(String status) async {
    final labels = {'CONFIRMED': 'Konfirmasi', 'COMPLETED': 'Selesaikan', 'CANCELLED': 'Batalkan'};
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('${labels[status]} Transaksi?', style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
        content: Text(_confirmMessage(status), style: const TextStyle(fontFamily: 'Poppins')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: status == 'CANCELLED' ? ElevatedButton.styleFrom(backgroundColor: AppColors.error) : null,
            child: Text(labels[status]!),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isUpdating = true);
    try {
      final res = await ApiService.updateTransactionStatus(_transaction.id, status);
      // Reload transaction detail
      final detailRes = await ApiService.getTransactionById(_transaction.id);
      setState(() {
        _transaction = TransactionModel.fromJson(detailRes['data']);
        _isUpdating = false;
      });
      widget.onUpdate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Status diperbarui'), backgroundColor: AppColors.success),
        );
      }
    } on ApiException catch (e) {
      setState(() => _isUpdating = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message), backgroundColor: AppColors.error));
    }
  }

  String _confirmMessage(String status) {
    switch (status) {
      case 'CONFIRMED': return 'Kamu mengkonfirmasi bahwa kamu bersedia menyelesaikan transaksi ini.';
      case 'COMPLETED': return 'Tandai transaksi ini sebagai selesai. Buyer dapat memberikan review.';
      case 'CANCELLED': return 'Transaksi akan dibatalkan dan tidak dapat diubah kembali.';
      default: return '';
    }
  }

  Future<void> _openReview() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ReviewSheet(
        transaction: _transaction,
        onSubmitted: () async {
          final detailRes = await ApiService.getTransactionById(_transaction.id);
          setState(() => _transaction = TransactionModel.fromJson(detailRes['data']));
          widget.onUpdate();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = _transaction;
    final title = t.listing?['title'] ?? 'Produk';
    final otherUser = widget.isBuyer ? t.seller : t.buyer;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Detail Transaksi')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary.withOpacity(0.8), AppColors.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontFamily: 'Poppins', fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(FormatUtils.currency(t.price), style: const TextStyle(fontFamily: 'Poppins', fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.25), borderRadius: BorderRadius.circular(20)),
                    child: Text(t.statusLabel, style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Lawan transaksi
            _InfoCard(
              title: widget.isBuyer ? 'Penjual' : 'Pembeli',
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primaryLighter,
                    child: Text(
                      otherUser?.name[0].toUpperCase() ?? '?',
                      style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(otherUser?.name ?? '-', style: Theme.of(context).textTheme.titleMedium),
                      if (otherUser?.isVerified == true)
                        const Row(children: [
                          Icon(Icons.verified_rounded, size: 12, color: AppColors.primary),
                          SizedBox(width: 4),
                          Text('Terverifikasi BINUS', style: TextStyle(fontFamily: 'Poppins', fontSize: 11, color: AppColors.primary)),
                        ]),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Catatan buyer
            if (t.note != null && t.note!.isNotEmpty)
              _InfoCard(
                title: 'Catatan',
                child: Text(t.note!, style: Theme.of(context).textTheme.bodyMedium),
              ),

            if (t.note != null && t.note!.isNotEmpty) const SizedBox(height: 12),

            // Tanggal
            _InfoCard(
              title: 'Tanggal Transaksi',
              child: Text(FormatUtils.dateTime(t.createdAt), style: Theme.of(context).textTheme.bodyMedium),
            ),

            const SizedBox(height: 12),

            // Review (jika sudah ada)
            if (t.review != null)
              _InfoCard(
                title: 'Review',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: List.generate(5, (i) => Icon(
                        i < t.review!.rating ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: Colors.amber,
                        size: 20,
                      )),
                    ),
                    if (t.review!.comment != null) ...[
                      const SizedBox(height: 6),
                      Text(t.review!.comment!, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ],
                ),
              ),

            const SizedBox(height: 32),

            // Action buttons
            if (_isUpdating)
              const Center(child: CircularProgressIndicator(color: AppColors.primary))
            else ...[
              // Seller actions
              if (!widget.isBuyer) ...[
                if (t.status == 'PENDING')
                  _ActionButton(label: 'Konfirmasi Transaksi', icon: Icons.check_circle_outline_rounded, color: AppColors.success, onTap: () => _updateStatus('CONFIRMED')),
                if (t.status == 'CONFIRMED')
                  _ActionButton(label: 'Tandai Selesai', icon: Icons.done_all_rounded, color: AppColors.primary, onTap: () => _updateStatus('COMPLETED')),
                if (['PENDING', 'CONFIRMED'].contains(t.status))
                  _ActionButton(label: 'Batalkan Transaksi', icon: Icons.cancel_outlined, color: AppColors.error, onTap: () => _updateStatus('CANCELLED'), isOutline: true),
              ],

              // Buyer actions
              if (widget.isBuyer) ...[
                if (t.status == 'PENDING')
                  _ActionButton(label: 'Batalkan Permintaan', icon: Icons.cancel_outlined, color: AppColors.error, onTap: () => _updateStatus('CANCELLED'), isOutline: true),
                if (t.canReview)
                  _ActionButton(label: 'Beri Review', icon: Icons.star_outline_rounded, color: AppColors.warning, onTap: _openReview),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _InfoCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isOutline;

  const _ActionButton({required this.label, required this.icon, required this.color, required this.onTap, this.isOutline = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SizedBox(
        width: double.infinity,
        child: isOutline
            ? OutlinedButton.icon(
                onPressed: onTap,
                icon: Icon(icon, size: 18, color: color),
                label: Text(label),
                style: OutlinedButton.styleFrom(foregroundColor: color, side: BorderSide(color: color, width: 1.5)),
              )
            : ElevatedButton.icon(
                onPressed: onTap,
                icon: Icon(icon, size: 18),
                label: Text(label),
                style: ElevatedButton.styleFrom(backgroundColor: color),
              ),
      ),
    );
  }
}

// ── Review Bottom Sheet ───────────────────────
class _ReviewSheet extends StatefulWidget {
  final TransactionModel transaction;
  final VoidCallback onSubmitted;
  const _ReviewSheet({required this.transaction, required this.onSubmitted});

  @override
  State<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<_ReviewSheet> {
  int _rating = 5;
  final _commentCtrl = TextEditingController();
  bool _isSubmitting = false;

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);
    try {
      await ApiService.createReview(
        transactionId: widget.transaction.id,
        rating: _rating,
        comment: _commentCtrl.text.trim().isNotEmpty ? _commentCtrl.text.trim() : null,
      );
      widget.onSubmitted();
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.grey300, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Text('Beri Review', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text('Bagaimana pengalaman transaksimu?', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) => GestureDetector(
              onTap: () => setState(() => _rating = i + 1),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Icon(i < _rating ? Icons.star_rounded : Icons.star_outline_rounded, color: Colors.amber, size: 40),
              ),
            )),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _commentCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Komentar (opsional)', hintText: 'Tulis pengalamanmu...'),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Kirim Review'),
            ),
          ),
        ],
      ),
    );
  }
}
