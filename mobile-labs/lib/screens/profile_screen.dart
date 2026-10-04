import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My profile")),
      body: LoadView<Json>(
        load: () => ApiClient.instance.get("/me"),
        builder: (context, data) {
          final p = (data["profile"] as Json?) ?? {};
          final rows = [
            ("Employee code", p["code"]),
            ("Login ID", p["appUsername"]),
            ("Designation", p["designation"]),
            ("Division", p["division"]),
            ("Zone / HQ", p["zone"]),
            ("Reports to", p["reportingTo"]),
            ("Mobile", p["contactNo"]),
            ("Email", p["email"]),
            ("City", [str(p["city"]), str(p["state"])].where((s) => s.isNotEmpty).join(", ")),
            ("Joined", str(p["dateOfJoin"]).isEmpty ? "" : fmtDate(p["dateOfJoin"])),
          ];
          final name = str(p["name"]);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: CircleAvatar(
                  radius: 36,
                  backgroundColor: AppTheme.indigo,
                  child: Text(
                    name.isEmpty ? "?" : name.trim().split(RegExp(r"\s+")).take(2).map((w) => w[0].toUpperCase()).join(),
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(name, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              Card(
                child: Column(
                  children: [
                    for (final (label, value) in rows)
                      if (str(value).isNotEmpty)
                        ListTile(
                          dense: true,
                          title: Text(label, style: Theme.of(context).textTheme.bodySmall),
                          subtitle: Text(str(value), style: Theme.of(context).textTheme.bodyMedium),
                        ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => const _PasswordSheet()),
                icon: const Icon(Icons.lock_reset_rounded),
                label: const Text("Change password"),
              ),
              const SizedBox(height: 8),
              Text(
                "Details wrong? Ask the office to update them in NBC Labs.",
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PasswordSheet extends StatefulWidget {
  const _PasswordSheet();

  @override
  State<_PasswordSheet> createState() => _PasswordSheetState();
}

class _PasswordSheetState extends State<_PasswordSheet> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post("/auth/password", {"currentPassword": _current.text, "newPassword": _next.text});
      if (!mounted) return;
      showMessage(context, "Password changed.");
      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text("Change password", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextFormField(
              controller: _current,
              obscureText: true,
              decoration: const InputDecoration(labelText: "Current password"),
              validator: (v) => (v ?? "").isEmpty ? "Enter your current password" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _next,
              obscureText: true,
              decoration: const InputDecoration(labelText: "New password (6+ characters)"),
              validator: (v) => (v ?? "").length < 6 ? "At least 6 characters" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              obscureText: true,
              decoration: const InputDecoration(labelText: "Repeat new password"),
              validator: (v) => v != _next.text ? "Passwords do not match" : null,
            ),
            const SizedBox(height: 16),
            BusyButton(label: "Change password", busy: _saving, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
