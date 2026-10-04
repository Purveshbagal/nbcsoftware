import "dart:async";

import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../services/notification_service.dart";
import "../services/session_store.dart";
import "../services/status_watcher.dart";
import "approval_status_screen.dart";
import "dashboard_screen.dart";
import "give_payment_screen.dart";
import "login_screen.dart";
import "register_list_screen.dart";
import "payment_request_screen.dart";
import "payment_status_screen.dart";
import "survey_doctor_list_screen.dart";

class HomeScreen extends StatefulWidget {
  final ApiClient apiClient;
  final SessionStore sessionStore;
  final Session session;

  const HomeScreen({
    super.key,
    required this.apiClient,
    required this.sessionStore,
    required this.session,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

const _statusWatchInterval = Duration(seconds: 15);

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;
  late final StatusWatcher _statusWatcher;
  Timer? _statusWatchTimer;

  @override
  void initState() {
    super.initState();
    _statusWatcher = StatusWatcher(widget.apiClient);
    NotificationService.instance.init().then((_) => _statusWatcher.check());
    _statusWatchTimer = Timer.periodic(
      _statusWatchInterval,
      (_) => _statusWatcher.check(),
    );
  }

  @override
  void dispose() {
    _statusWatchTimer?.cancel();
    super.dispose();
  }

  Future<void> _logout() async {
    await widget.sessionStore.clear();
    widget.apiClient.setToken(null);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LoginScreen(
          apiClient: widget.apiClient,
          sessionStore: widget.sessionStore,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(apiClient: widget.apiClient, session: widget.session),
      RegisterListScreen(apiClient: widget.apiClient),
      PaymentRequestScreen(apiClient: widget.apiClient),
      GivePaymentScreen(apiClient: widget.apiClient),
      SurveyDoctorListScreen(apiClient: widget.apiClient),
    ];

    const titles = [
      "Dashboard",
      "New Register",
      "Payment Request",
      "Give Payment",
      "Survey Paper",
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_index]),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: "Logout",
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DrawerHeader(
                decoration: const BoxDecoration(color: AppTheme.navy),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Icon(
                      Icons.school_outlined,
                      color: AppTheme.mint,
                      size: 32,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      widget.session.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      widget.session.username,
                      style: const TextStyle(
                        color: Color(0xFFCBDDE7),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              ListTile(
                leading: const Icon(Icons.fact_check_outlined),
                title: const Text("Approval Status"),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => Scaffold(
                        appBar: AppBar(title: const Text("Approval Status")),
                        body: ApprovalStatusScreen(apiClient: widget.apiClient),
                      ),
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.receipt_long_outlined),
                title: const Text("Payment Status"),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => Scaffold(
                        appBar: AppBar(title: const Text("Payment Status")),
                        body: PaymentStatusScreen(apiClient: widget.apiClient),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: "Home",
          ),
          NavigationDestination(
            icon: Icon(Icons.person_add_alt_outlined),
            selectedIcon: Icon(Icons.person_add_alt),
            label: "Register",
          ),
          NavigationDestination(
            icon: Icon(Icons.request_page_outlined),
            selectedIcon: Icon(Icons.request_page),
            label: "Payment",
          ),
          NavigationDestination(
            icon: Icon(Icons.badge_outlined),
            selectedIcon: Icon(Icons.badge),
            label: "Disburse",
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: "Survey",
          ),
        ],
      ),
    );
  }
}
