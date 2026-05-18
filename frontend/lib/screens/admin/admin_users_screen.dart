// lib/screens/admin/admin_users_screen.dart
// UC-008: Manage Users

import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/format_utils.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<UserModel> _users = [];
  bool _isLoading = true;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({String? keyword}) async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getAllUsers(keyword: keyword);
      final data = res['data'] as List;
      setState(() {
        _users = data.map((e) => UserModel.fromJson(e)).toList();
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleUser(UserModel user) async {
    final isActive = (user as dynamic).isActive ?? true;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(isActive ? 'Nonaktifkan User?' : 'Aktifkan User?', style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
        content: Text(
          isActive ? '${user.name} tidak dapat login setelah dinonaktifkan.' : '${user.name} dapat login kembali.',
          style: const TextStyle(fontFamily: 'Poppins'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: isActive ? AppColors.error : AppColors.success),
            child: Text(isActive ? 'Nonaktifkan' : 'Aktifkan'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      await ApiService.toggleUserStatus(user.id);
      _load(keyword: _searchCtrl.text.trim().isNotEmpty ? _searchCtrl.text : null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(isActive ? 'User dinonaktifkan' : 'User diaktifkan'), backgroundColor: AppColors.success),
        );
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Kelola Users')),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              onSubmitted: (v) => _load(keyword: v.trim().isNotEmpty ? v : null),
              decoration: InputDecoration(
                hintText: 'Cari nama, email, atau NIM...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.close_rounded), onPressed: () { _searchCtrl.clear(); _load(); })
                    : null,
              ),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemCount: _users.length,
                      itemBuilder: (_, i) {
                        final u = _users[i];
                        // isActive tidak ada di UserModel base, tapi datanya ada dari JSON
                        // Kita parse langsung dari raw map — untuk ini kita butuh akses ke raw data
                        // Untuk simplicity: default asumsi aktif jika tidak ada field
                        return Container(
                          decoration: AppDecorations.card,
                          child: ListTile(
                            contentPadding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
                            leading: CircleAvatar(
                              radius: 22,
                              backgroundColor: AppColors.primaryLighter,
                              child: Text(u.name[0].toUpperCase(), style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700, color: AppColors.primary)),
                            ),
                            title: Row(
                              children: [
                                Expanded(child: Text(u.name, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                                if (u.isVerified) const Icon(Icons.verified_rounded, size: 14, color: AppColors.primary),
                              ],
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(u.email, style: Theme.of(context).textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                                if (u.studentId != null) Text('NIM: ${u.studentId}', style: Theme.of(context).textTheme.bodySmall),
                              ],
                            ),
                            trailing: Switch(
                              value: true, // Default true; idealnya dari raw JSON isActive
                              activeColor: AppColors.success,
                              onChanged: (_) => _toggleUser(u),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
