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
import "post_update_screen.dart";
import "profile_screen.dart";
import "reminders_screen.dart";
import "support_screen.dart";
import "sample_request_screen.dart";
import "targets_screen.dart";
import "your_advance_screen.dart";
import "your_attendance_screen.dart";
import "your_salary_screen.dart";

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
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancel"),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Sign out"),
          ),
        ],
      ),
    );
    if (ok == true) onSignOut();
  }

  @override
  Widget build(BuildContext context) {
    final groups = <(String, List<(IconData, String, String, Widget)>)>[
      (
        "Field work",
        [
          (
            Icons.contacts_outlined,
            "Doctors & firms",
            "Your field directory",
            const DirectoryScreen(),
          ),
          (
            Icons.shopping_bag_outlined,
            "Orders",
            "Book and track orders",
            const OrdersScreen(),
          ),
          (
            Icons.slideshow_rounded,
            "E-detailing",
            "Product presentations",
            const MediaScreen(),
          ),
          (
            Icons.flag_outlined,
            "My targets",
            "Progress and performance",
            const TargetsScreen(),
          ),
          (
            Icons.task_alt_rounded,
            "Tasks",
            "Reminders and follow-ups",
            const RemindersScreen(),
          ),
          (Icons.inventory_2_outlined, "Sample requests", "Request product samples", const SampleRequestScreen()),
        ],
      ),
      (
        "Work & attendance",
        [
          (
            Icons.edit_note_outlined,
            "Update",
            "Post your daily work progress",
            const PostUpdateScreen(),
          ),
          (
            Icons.beach_access_outlined,
            "Leave",
            "Requests and approvals",
            const LeaveScreen(),
          ),
          (
            Icons.receipt_long_outlined,
            "Expenses",
            "Submit and track claims",
            const ExpenseScreen(),
          ),
          (
            Icons.event_outlined,
            "Holidays",
            "Plan your calendar",
            const HolidaysScreen(),
          ),
          (
            Icons.calendar_today_outlined,
            "Your Attendance",
            "Monthly attendance & salary",
            const YourAttendanceScreen(),
          ),
          (
            Icons.account_balance_wallet_outlined,
            "Your Advance",
            "Advance requests & deductions",
            const YourAdvanceScreen(),
          ),
          (
            Icons.payments_outlined,
            "Your Salary",
            "Salary details & history",
            const YourSalaryScreen(),
          ),
        ],
      ),
      (
        "Account",
        [
          (
            Icons.person_outline_rounded,
            "Profile",
            "Your details and password",
            const ProfileScreen(),
          ),
          (
            Icons.support_agent_rounded,
            "Support",
            "Get help from your team",
            const SupportScreen(),
          ),
        ],
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text("More")),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
        children: [
          Card(
            color: AppTheme.navy,
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => _open(context, const ProfileScreen()),
              child: Ink(
                decoration: const BoxDecoration(gradient: AppTheme.brandGradient),
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        session.name.isEmpty
                            ? "?"
                            : session.name.characters.first.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "MY WORKSPACE",
                            style: TextStyle(
                              color: AppTheme.onNavySubtle,
                              fontSize: 9,
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            session.name.isEmpty
                                ? session.username
                                : session.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (session.designation.isNotEmpty ||
                              session.zone.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              [
                                session.designation,
                                session.zone,
                              ].where((s) => s.isNotEmpty).join(" · "),
                              style: const TextStyle(
                                color: AppTheme.onNavyMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 20,
                      color: AppTheme.onNavyMuted,
                    ),
                  ],
                ),
              ),
            ),
          ),
          for (final (title, items) in groups) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(2, 24, 2, 10),
              child: Text(
                title.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                  color: AppTheme.muted,
                ),
              ),
            ),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  for (var index = 0; index < items.length; index++) ...[
                    _MenuRow(
                      icon: items[index].$1,
                      title: items[index].$2,
                      subtitle: items[index].$3,
                      accent: title == "Work & attendance"
                          ? AppTheme.emerald
                          : AppTheme.indigo,
                      onTap: () => _open(context, items[index].$4),
                    ),
                    if (index < items.length - 1)
                      const Divider(indent: 62, endIndent: 16, height: 1),
                  ],
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.danger,
              backgroundColor: Colors.white,
            ),
            onPressed: () => _confirmSignOut(context),
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: const Text("Sign out"),
          ),
          const SizedBox(height: 12),
          Text(
            "NBC Labs · ${session.username}",
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall
                ?.copyWith(fontSize: 10.5),
          ),
        ],
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color accent;
  final VoidCallback onTap;

  const _MenuRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.09),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: accent, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.ink,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(fontSize: 10.5),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppTheme.muted,
              size: 19,
            ),
          ],
        ),
      ),
    );
  }
}
