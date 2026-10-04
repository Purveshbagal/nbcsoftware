import "package:device_info_plus/device_info_plus.dart";
import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../services/session_store.dart";

class LoginScreen extends StatefulWidget {
  final Future<void> Function(Session session) onSignedIn;
  const LoginScreen({super.key, required this.onSignedIn});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<String> _device() async {
    try {
      final info = await DeviceInfoPlugin().androidInfo;
      return "${info.manufacturer} ${info.model} · Android ${info.version.release}";
    } catch (_) {
      return "";
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.post("/auth/login", {
        "username": _username.text.trim(),
        "password": _password.text,
        "device": await _device(),
      });
      await widget.onSignedIn(Session.fromLogin(data));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [AppTheme.indigo, Color(0xFF6C5CE7)]),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(Icons.biotech_rounded, color: Colors.white, size: 38),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text("NBC Labs", textAlign: TextAlign.center, style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 6),
                  Text(
                    "Field employee sign in",
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.muted),
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _username,
                    decoration: const InputDecoration(labelText: "Login ID", prefixIcon: Icon(Icons.badge_outlined)),
                    autocorrect: false,
                    textInputAction: TextInputAction.next,
                    validator: (v) => (v ?? "").trim().isEmpty ? "Enter your login ID" : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: "Password",
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) => (v ?? "").isEmpty ? "Enter your password" : null,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    Text(_error!, style: const TextStyle(color: AppTheme.danger)),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text("Sign in"),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "Your login is created by the NBC Labs office. NBC Pedia logins do not work here.",
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
