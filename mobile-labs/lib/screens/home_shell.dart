import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/location_tracker.dart";
import "../services/session_store.dart";
import "attendance_screen.dart";
import "home_screen.dart";
import "more_screen.dart";
import "visits_screen.dart";

class HomeShell extends StatefulWidget {
  final Session session;
  final VoidCallback onSignOut;
  const HomeShell({super.key, required this.session, required this.onSignOut});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> with WidgetsBindingObserver {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Coming back to the app is a good moment to send anything queued offline.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) LocationTracker.instance.upload();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(
        session: widget.session,
        onOpenTab: (i) => setState(() => _index = i),
      ),
      const VisitsScreen(),
      const AttendanceScreen(),
      MoreScreen(session: widget.session, onSignOut: widget.onSignOut),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: DecoratedBox(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.border)),
        ),
        child: NavigationBar(
          height: 64,
          animationDuration: const Duration(milliseconds: 220),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: "Home",
            ),
            NavigationDestination(
              icon: Icon(Icons.place_outlined),
              selectedIcon: Icon(Icons.place_rounded),
              label: "Visits",
            ),
            NavigationDestination(
              icon: Icon(Icons.event_available_outlined),
              selectedIcon: Icon(Icons.event_available_rounded),
              label: "Attendance",
            ),
            NavigationDestination(
              icon: Icon(Icons.widgets_outlined),
              selectedIcon: Icon(Icons.widgets_rounded),
              label: "More",
            ),
          ],
        ),
      ),
    );
  }
}
