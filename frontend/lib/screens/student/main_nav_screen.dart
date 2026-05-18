// lib/screens/student/main_nav_screen.dart
// Bottom Navigation untuk Student

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'home_screen.dart';
import 'my_listings_screen.dart';
import 'transactions_screen.dart';
import 'chat_list_screen.dart';
import 'profile_screen.dart';

class MainNavScreen extends StatefulWidget {
  const MainNavScreen({super.key});

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  int _currentIndex = 0;
  int _totalUnread = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    MyListingsScreen(),
    TransactionsScreen(),
    ChatListScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _loadUnreadCount();
    // Refresh unread count setiap 5 detik
    Future.delayed(const Duration(seconds: 5)).then((_) {
      if (mounted) {
        _loadUnreadCount();
      }
    });
  }

  Future<void> _loadUnreadCount() async {
    try {
      final res = await ApiService.getChatRooms();
      final data = res['data'] as List;
      final rooms = data.map((e) => ChatRoomModel.fromJson(e)).toList();
      final total = rooms.fold<int>(0, (sum, room) => sum + room.unreadCount);
      setState(() => _totalUnread = total);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) {
            setState(() => _currentIndex = i);
            if (i == 3) _loadUnreadCount(); // Reload saat buka chat
          },
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Beranda',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.storefront_outlined),
              activeIcon: Icon(Icons.storefront_rounded),
              label: 'Jualanku',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined),
              activeIcon: Icon(Icons.receipt_long_rounded),
              label: 'Transaksi',
            ),
            BottomNavigationBarItem(
              icon: _buildChatIcon(),
              activeIcon: _buildChatIcon(active: true),
              label: 'Pesan',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatIcon({bool active = false}) {
    return Stack(
      children: [
        Icon(active ? Icons.chat_bubble_rounded : Icons.chat_bubble_outline_rounded),
        if (_totalUnread > 0)
          Positioned(
            right: -4,
            top: -4,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
              child: Text(
                _totalUnread > 99 ? '99+' : _totalUnread.toString(),
                style: const TextStyle(fontFamily: 'Poppins', color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
              ),
            ),
          ),
      ],
    );
  }
}
