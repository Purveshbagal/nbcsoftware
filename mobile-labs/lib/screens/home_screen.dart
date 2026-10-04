import "dart:async";

import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../services/location_tracker.dart";
import "../services/permissions.dart";
import "../services/session_store.dart";
import "../widgets/common.dart";
import "expense_screen.dart";
import "holidays_screen.dart";
import "leave_screen.dart";
import "new_visit_screen.dart";
import "orders_screen.dart";
import "reminders_screen.dart";
import "sample_requests_screen.dart";

class HomeScreen extends StatefulWidget {
  final Session session;
  final ValueChanged<int> onOpenTab;
  const HomeScreen({super.key, required this.session, required this.onOpenTab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _loader = GlobalKey<LoadViewState<Json>>();

  Future<Json> _load() async {
    final data = await ApiClient.instance.get("/me");
    await _syncTracker(data["attendance"] as Json?);
    return data;
  }

  /// Tracking follows the duty state on the server, so it resumes after the
  /// phone restarts and stops if the day was closed from somewhere else.
  Future<void> _syncTracker(Json? attendance) async {
    final onDuty = attendance?["punchIn"]?["at"] != null && attendance?["punchOut"]?["at"] == null;
    final tracker = LocationTracker.instance;
    if (onDuty && !tracker.running.value) {
      await tracker.start();
    } else if (!onDuty && tracker.running.value) {
      await tracker.stop();
    }
  }

  void _refresh() => _loader.currentState?.reload();

  Future<void> _open(Widget screen) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LoadView<Json>(
          key: _loader,
          load: _load,
          builder: (context, data) => _HomeBody(
            session: widget.session,
            data: data,
            onChanged: _refresh,
            onOpen: _open,
            onOpenTab: widget.onOpenTab,
          ),
        ),
      ),
    );
  }
}

class _HomeBody extends StatelessWidget {
  final Session session;
  final Json data;
  final VoidCallback onChanged;
  final Future<void> Function(Widget) onOpen;
  final ValueChanged<int> onOpenTab;
  const _HomeBody({required this.session, required this.data, required this.onChanged, required this.onOpen, required this.onOpenTab});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final stats = (data["stats"] as Json?) ?? {};
    final profile = (data["profile"] as Json?) ?? {};
    final holiday = data["nextHoliday"] as Json?;
    final name = str(profile["name"]).isEmpty ? session.name : str(profile["name"]);
    final subtitle = [str(profile["designation"]), str(profile["zone"])].where((s) => s.isNotEmpty).join(" · ");

    final actions = <(IconData, String, Color, Widget)>[
      (Icons.add_location_alt_rounded, "New visit", AppTheme.indigo, const NewVisitScreen()),
      (Icons.beach_access_rounded, "Apply leave", const Color(0xFF0EA5E9), const LeaveScreen()),
      (Icons.receipt_long_rounded, "Expense", AppTheme.emerald, const ExpenseScreen()),
      (Icons.shopping_cart_rounded, "Book order", const Color(0xFF8B5CF6), const OrdersScreen()),
      (Icons.medication_rounded, "Samples", const Color(0xFFEC4899), const SampleRequestsScreen()),
      (Icons.event_rounded, "Holidays", AppTheme.amber, const HolidaysScreen()),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_greeting(), style: theme.textTheme.bodySmall?.copyWith(fontSize: 13)),
                  const SizedBox(height: 2),
                  Text(name, style: theme.textTheme.headlineSmall),
                  if (subtitle.isNotEmpty) Text(subtitle, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
            IconButton.filledTonal(
              tooltip: "Tasks",
              onPressed: () => onOpen(const RemindersScreen()),
              icon: Badge(
                isLabelVisible: (stats["openReminders"] ?? 0) > 0,
                label: Text("${stats["openReminders"] ?? 0}"),
                child: const Icon(Icons.notifications_none_rounded),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        DutyCard(attendance: data["attendance"] as Json?, onChanged: onChanged),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.15,
          children: [
            _Stat("Visits today", "${stats["visitsToday"] ?? 0}", Icons.place_rounded, () => onOpenTab(1)),
            _Stat("This month", "${stats["visitsMonth"] ?? 0}", Icons.insights_rounded, () => onOpenTab(1)),
            _Stat("Days present", "${stats["presentDays"] ?? 0}", Icons.event_available_rounded, () => onOpenTab(2)),
            _Stat("Leave pending", "${stats["pendingLeaves"] ?? 0}", Icons.hourglass_top_rounded, () => onOpen(const LeaveScreen())),
            _Stat("Claims pending", "${stats["pendingExpenses"] ?? 0}", Icons.receipt_rounded, () => onOpen(const ExpenseScreen())),
            _Stat("Open tasks", "${stats["openReminders"] ?? 0}", Icons.task_alt_rounded, () => onOpen(const RemindersScreen())),
          ],
        ),
        const SectionLabel("Quick actions"),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.05,
          children: [
            for (final (icon, label, color, screen) in actions)
              Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => onOpen(screen),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: color.withValues(alpha: 0.12),
                        child: Icon(icon, color: color),
                      ),
                      const SizedBox(height: 8),
                      Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
          ],
        ),
        if (holiday != null) ...[
          const SectionLabel("Next holiday"),
          RecordTile(
            leading: const CircleAvatar(
              backgroundColor: Color(0xFFFFF0D9),
              child: Icon(Icons.celebration_rounded, color: AppTheme.amber),
            ),
            title: str(holiday["occasion"]).isEmpty ? "Holiday" : str(holiday["occasion"]),
            subtitle: fmtDayShort(holiday["date"]),
            onTap: () => onOpen(const HolidaysScreen()),
          ),
        ],
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onTap;
  const _Stat(this.label, this.value, this.icon, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 18, color: AppTheme.muted),
              Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
              Text(label, style: Theme.of(context).textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

/// Punch in / on duty with a running clock / day done.
class DutyCard extends StatefulWidget {
  final Json? attendance;
  final VoidCallback onChanged;
  const DutyCard({super.key, required this.attendance, required this.onChanged});

  @override
  State<DutyCard> createState() => _DutyCardState();
}

class _DutyCardState extends State<DutyCard> {
  Timer? _ticker;
  bool _busy = false;

  DateTime? get _inAt => parseDate(widget.attendance?["punchIn"]?["at"]);
  DateTime? get _outAt => parseDate(widget.attendance?["punchOut"]?["at"]);
  bool get _onDuty => _inAt != null && _outAt == null;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_onDuty && mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _punchIn() async {
    final agendas = (await ApiClient.instance.masters(["work-agenda"]))["work-agenda"]!;
    if (!mounted) return;
    final agenda = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _AgendaSheet(options: agendas),
    );
    if (agenda == null || !mounted) return;

    setState(() => _busy = true);
    try {
      final position = await AppPermissions.currentPosition();
      await ApiClient.instance.post("/attendance/punch-in", {
        "lat": position.latitude,
        "lng": position.longitude,
        "accuracy": position.accuracy,
        "workAgenda": agenda,
      });
      final started = await LocationTracker.instance.start();
      await LocationTracker.instance.addFix(position);
      if (mounted) {
        showMessage(
          context,
          started ? "Punched in. Have a good day!" : "Punched in, but location sharing could not start — check permissions.",
        );
      }
      widget.onChanged();
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _punchOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Punch out?"),
        content: const Text("This ends your working day and stops location sharing."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text("Punch out")),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      Json body = {};
      try {
        final position = await AppPermissions.currentPosition();
        body = {"lat": position.latitude, "lng": position.longitude, "accuracy": position.accuracy};
        await LocationTracker.instance.addFix(position);
      } catch (_) {
        // Punching out must work even without a fix.
      }
      // Send the trail first so the day's distance is complete.
      await LocationTracker.instance.upload();
      await ApiClient.instance.post("/attendance/punch-out", body);
      await LocationTracker.instance.stop();
      if (mounted) showMessage(context, "Punched out. See you tomorrow!");
      widget.onChanged();
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inAt = _inAt;
    final outAt = _outAt;
    final minutes = inAt == null ? 0 : (outAt ?? DateTime.now()).difference(inAt).inMinutes;

    final (title, detail, colors) = switch ((inAt, outAt)) {
      (null, _) => ("Not punched in", "Punch in to start your day", [const Color(0xFF4B4ACF), const Color(0xFF6C5CE7)]),
      (_, null) => ("On duty · ${fmtDuration(minutes)}", "Since ${fmtTime(inAt)}", [const Color(0xFF0B8F64), const Color(0xFF14B88A)]),
      _ => (
        "Day complete · ${fmtDuration(minutes)}",
        "${fmtTime(inAt)} – ${fmtTime(outAt)} · ${(widget.attendance?["distanceKm"] ?? 0)} km",
        [const Color(0xFF39405F), const Color(0xFF545C80)],
      ),
    };

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.fingerprint_rounded, color: Colors.white70),
              const SizedBox(width: 8),
              Text(fmtDayShort(DateTime.now().toIso8601String()), style: const TextStyle(color: Colors.white70)),
              const Spacer(),
              ValueListenableBuilder<bool>(
                valueListenable: LocationTracker.instance.running,
                builder: (_, running, _) => running
                    ? const Row(
                        children: [
                          Icon(Icons.gps_fixed_rounded, color: Colors.white, size: 16),
                          SizedBox(width: 4),
                          Text("Sharing location", style: TextStyle(color: Colors.white, fontSize: 12)),
                        ],
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(detail, style: const TextStyle(color: Colors.white70)),
          if (str(widget.attendance?["workAgenda"]).isNotEmpty) ...[
            const SizedBox(height: 4),
            Text("Agenda: ${widget.attendance!["workAgenda"]}", style: const TextStyle(color: Colors.white70)),
          ],
          if (outAt == null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: colors.first),
                onPressed: _busy ? null : (inAt == null ? _punchIn : _punchOut),
                icon: _busy
                    ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: colors.first))
                    : Icon(inAt == null ? Icons.login_rounded : Icons.logout_rounded),
                label: Text(inAt == null ? "Punch in" : "Punch out"),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AgendaSheet extends StatefulWidget {
  final List<String> options;
  const _AgendaSheet({required this.options});

  @override
  State<_AgendaSheet> createState() => _AgendaSheetState();
}

class _AgendaSheetState extends State<_AgendaSheet> {
  String _agenda = "";

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text("Today's work agenda", style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text("Your location is recorded with your punch-in.", style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          if (widget.options.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final option in widget.options)
                  ChoiceChip(
                    label: Text(option),
                    selected: _agenda == option,
                    onSelected: (_) => setState(() => _agenda = option),
                  ),
              ],
            )
          else
            TextField(
              decoration: const InputDecoration(labelText: "Agenda (e.g. Field work, Meeting)"),
              onChanged: (v) => setState(() => _agenda = v.trim()),
            ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, _agenda.isEmpty ? "Field work" : _agenda),
            icon: const Icon(Icons.login_rounded),
            label: const Text("Punch in now"),
          ),
        ],
      ),
    );
  }
}
