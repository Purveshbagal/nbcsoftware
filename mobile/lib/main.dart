import "package:flutter/material.dart";

import "app_theme.dart";
import "services/api_client.dart";
import "services/session_store.dart";
import "screens/home_screen.dart";
import "screens/login_screen.dart";

void main() {
  runApp(const NbcPediaFieldApp());
}

class NbcPediaFieldApp extends StatelessWidget {
  const NbcPediaFieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "NBC Pedia Field",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const _Bootstrap(),
    );
  }
}

class _Bootstrap extends StatefulWidget {
  const _Bootstrap();

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  final _apiClient = ApiClient();
  final _sessionStore = SessionStore();
  late Future<Session?> _sessionFuture;

  @override
  void initState() {
    super.initState();
    _sessionFuture = _restoreSession();
  }

  Future<Session?> _restoreSession() async {
    final session = await _sessionStore.load();
    if (session != null) {
      _apiClient.setToken(session.token);
    }
    return session;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Session?>(
      future: _sessionFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final session = snapshot.data;
        if (session == null) {
          return LoginScreen(
            apiClient: _apiClient,
            sessionStore: _sessionStore,
          );
        }

        return HomeScreen(
          apiClient: _apiClient,
          sessionStore: _sessionStore,
          session: session,
        );
      },
    );
  }
}
