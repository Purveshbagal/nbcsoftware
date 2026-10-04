import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/location_tracker.dart";
import "../services/session_store.dart";
import "directory_screen.dart";
import "expense_screen.dart";
import "holidays_screen.dart";
import "leave_screen.dart";
import "media_screen.dart";
import "orders_screen.dart";
import "permissions_screen.dart";
import "profile_screen.dart";
import "reminders_screen.dart";
import "sample_requests_screen.dart";
import "support_screen.dart";
import "targets_screen.dart";

class MoreScreen extends StatelessWidget {
  final Session session;
  final VoidCallback onSignOut;
  const MoreScreen({super.key, required this.session, required this.onSignOut});

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final onDuty = LocationTracker.instance.running.value;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Sign out?"),
        content: Text(
          onDuty
              ? "You are still punched in. Signing out stops location sharing — punch out first if your day is over."
              : "You will need your login ID and password to sign in again.",
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text("Sign out")),
        ],
      ),
    );
    if (ok == true) onSignOut();
  }

  @override
  Widget build(BuildContext context) {
    final groups = <(String, List<(IconData, String, Widget)>)>[
      (
        "Field work",
        [
          (Icons.contacts_rounded, "Doctors & Firms", const DirectoryScreen()),
          (Icons.shopping_cart_rounded, "Orders", const OrdersScreen()),
          (Icons.medication_rounded, "Samples & gifts", const SampleRequestsScreen()),
          (Icons.slideshow_rounded, "E-detailing", const MediaScreen()),
          (Icons.flag_rounded, "My targets", const TargetsScreen()),
          (Icons.task_alt_rounded, "Tasks", const RemindersScreen()),
        ],
      ),
      (
        "HR",
        [
          (Icons.beach_access_rounded, "Leave", const LeaveScreen()),
          (Icons.receipt_long_rounded, "Expenses", const ExpenseScreen()),
          (Icons.event_rounded, "Holidays", const HolidaysScreen()),
        ],
      ),
      (
        "Account",
        [
          (Icons.person_rounded, "Profile", const ProfileScreen()),
          (Icons.support_agent_rounded, "Support", const SupportScreen()),
          (
            Icons.admin_panel_settings_rounded,
            "Permissions",
            Builder(builder: (context) => PermissionsScreen(revisit: true, onDone: () async => Navigator.of(context).pop())),
          ),
        ],
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text("More")),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        children: [
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(14),
              leading: CircleAvatar(
                backgroundColor: AppTheme.indigo,
                child: Text(session.name.isEmpty ? "?" : session.name[0].toUpperCase(), style: const TextStyle(color: Colors.white)),
              ),
              title: Text(session.name, style: Theme.of(context).textTheme.titleMedium),
              subtitle: Text([session.designation, session.zone].where((s) => s.isNotEmpty).join(" · ")),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => _open(context, const ProfileScreen()),
            ),
          ),
          for (final (title, items) in groups) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 20, 4, 8),
              child: Text(
                title.toUpperCase(),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.1, color: AppTheme.muted),
              ),
            ),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.05,
              children: [
                for (final (icon, label, screen) in items)
                  Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => _open(context, screen),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(icon, color: AppTheme.indigo, size: 28),
                          const SizedBox(height: 8),
                          Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: AppTheme.danger),
            onPressed: () => _confirmSignOut(context),
            icon: const Icon(Icons.logout_rounded),
            label: const Text("Sign out"),
          ),
          const SizedBox(height: 12),
          Text("NBC Labs field app · ${session.username}", textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
