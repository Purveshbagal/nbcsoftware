import "package:flutter/material.dart";

import "app_theme.dart";
import "screens/home_shell.dart";
import "screens/login_screen.dart";
import "screens/permissions_screen.dart";
import "services/api_client.dart";
import "services/location_tracker.dart";
import "services/session_store.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NbcLabsApp());
}

final navigatorKey = GlobalKey<NavigatorState>();
final messengerKey = GlobalKey<ScaffoldMessengerState>();

class NbcLabsApp extends StatelessWidget {
  const NbcLabsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "NBC Labs",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: messengerKey,
      home: const _Bootstrap(),
    );
  }
}

enum _Stage { loading, permissions, login, home }

/// Decides the first screen: permissions on first launch, then sign-in, then
/// the app. Also owns sign-out, so a revoked login from anywhere lands here.
class _Bootstrap extends StatefulWidget {
  const _Bootstrap();

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  _Stage _stage = _Stage.loading;
  Session? _session;

  @override
  void initState() {
    super.initState();
    ApiClient.instance.onUnauthorized = () {
      if (_session == null) return;
      _signOut(message: "You have been signed out. Sign in again, or contact your administrator.");
    };
    _start();
  }

  Future<void> _start() async {
    final onboarded = await SessionStore.instance.isOnboarded();
    final session = await SessionStore.instance.load();
    if (session != null) ApiClient.instance.token = session.token;
    setState(() {
      _session = session;
      _stage = !onboarded ? _Stage.permissions : (session == null ? _Stage.login : _Stage.home);
    });
  }

  Future<void> _onPermissionsDone() async {
    await SessionStore.instance.setOnboarded();
    setState(() => _stage = _session == null ? _Stage.login : _Stage.home);
  }

  Future<void> _onSignedIn(Session session) async {
    await SessionStore.instance.save(session);
    ApiClient.instance.token = session.token;
    setState(() {
      _session = session;
      _stage = _Stage.home;
    });
  }

  Future<void> _signOut({String? message}) async {
    await LocationTracker.instance.clear();
    await SessionStore.instance.clear();
    ApiClient.instance.token = null;
    ApiClient.instance.clearCache();
    navigatorKey.currentState?.popUntil((route) => route.isFirst);
    setState(() {
      _session = null;
      _stage = _Stage.login;
    });
    if (message != null) {
      messengerKey.currentState?.showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (_stage) {
      case _Stage.loading:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case _Stage.permissions:
        return PermissionsScreen(onDone: _onPermissionsDone);
      case _Stage.login:
        return LoginScreen(onSignedIn: _onSignedIn);
      case _Stage.home:
        return HomeShell(session: _session!, onSignOut: () => _signOut());
    }
  }
}
