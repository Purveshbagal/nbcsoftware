import "dart:async";

import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../services/location_tracker.dart";
import "../services/permissions.dart";
import "../services/session_store.dart";
import "../widgets/common.dart";
import "directory_screen.dart";
import "expense_screen.dart";
import "holidays_screen.dart";
import "leave_screen.dart";
import "new_visit_screen.dart";
import "orders_screen.dart";
import "reminders_screen.dart";

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
    final onDuty =
        attendance?["punchIn"]?["at"] != null &&
        attendance?["punchOut"]?["at"] == null;
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
  const _HomeBody({
    required this.session,
    required this.data,
    required this.onChanged,
    required this.onOpen,
    required this.onOpenTab,
  });

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
    final name = str(profile["name"]).isEmpty
        ? session.name
        : str(profile["name"]);
    final subtitle = [
      str(profile["designation"]),
      str(profile["zone"]),
    ].where((s) => s.isNotEmpty).join(" · ");

    final actions = <(IconData, String, Color, Widget)>[
      (
        Icons.add_location_alt_rounded,
        "New visit",
        AppTheme.indigo,
        const NewVisitScreen(),
      ),
      (
        Icons.beach_access_outlined,
        "Apply leave",
        AppTheme.indigo,
        const LeaveScreen(),
      ),
      (
        Icons.receipt_long_rounded,
        "Expense",
        AppTheme.emerald,
        const ExpenseScreen(),
      ),
      (
        Icons.shopping_bag_outlined,
        "Book order",
        AppTheme.amber,
        const OrdersScreen(),
      ),
      (
        Icons.contacts_outlined,
        "Doctors",
        AppTheme.emerald,
        const DirectoryScreen(),
      ),
      (Icons.event_rounded, "Holidays", AppTheme.amber, const HolidaysScreen()),
    ];

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      children: [
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                gradient: AppTheme.brandGradient,
                borderRadius: BorderRadius.circular(11),
              ),
              child: const Icon(
                Icons.biotech_rounded,
                color: AppTheme.mint,
                size: 21,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "NBC LABS",
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "Your field workspace",
                    style: theme.textTheme.bodySmall?.copyWith(fontSize: 10.5),
                  ),
                ],
              ),
            ),
            IconButton.filledTonal(
              tooltip: "Tasks",
              style: IconButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppTheme.ink,
                side: const BorderSide(color: AppTheme.border),
              ),
              onPressed: () => onOpen(const RemindersScreen()),
              icon: Badge(
                isLabelVisible: (stats["openReminders"] ?? 0) > 0,
                label: Text("${stats["openReminders"] ?? 0}"),
                child: const Icon(Icons.notifications_none_rounded),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(_greeting(), style: theme.textTheme.bodySmall),
        const SizedBox(height: 3),
        Text(
          name.isEmpty ? "Welcome back" : name,
          style: theme.textTheme.headlineSmall,
        ),
        if (subtitle.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(subtitle, style: theme.textTheme.bodySmall),
        ],
        const SizedBox(height: 18),
        DutyCard(attendance: data["attendance"] as Json?, onChanged: onChanged),
        const SectionLabel("At a glance"),
        _DashboardGrid(
          children: [
            _Stat(
              "Visits today",
              "${stats["visitsToday"] ?? 0}",
              Icons.place_rounded,
              () => onOpenTab(1),
            ),
            _Stat(
              "This month",
              "${stats["visitsMonth"] ?? 0}",
              Icons.insights_rounded,
              () => onOpenTab(1),
            ),
            _Stat(
              "Days present",
              "${stats["presentDays"] ?? 0}",
              Icons.event_available_rounded,
              () => onOpenTab(2),
            ),
            _Stat(
              "Leave pending",
              "${stats["pendingLeaves"] ?? 0}",
              Icons.hourglass_top_rounded,
              () => onOpen(const LeaveScreen()),
            ),
            _Stat(
              "Claims pending",
              "${stats["pendingExpenses"] ?? 0}",
              Icons.receipt_rounded,
              () => onOpen(const ExpenseScreen()),
            ),
            _Stat(
              "Open tasks",
              "${stats["openReminders"] ?? 0}",
              Icons.task_alt_rounded,
              () => onOpen(const RemindersScreen()),
            ),
          ],
        ),
        const SectionLabel("Quick actions"),
        _DashboardGrid(
          columns: 2,
          children: [
            for (final (icon, label, color, screen) in actions)
              Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => onOpen(screen),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 13,
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.09),
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Icon(icon, color: color, size: 18),
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            label,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.ink,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
        if (holiday != null) ...[
          const SectionLabel("Next holiday"),
          RecordTile(
            leading: const CircleAvatar(
              backgroundColor: AppTheme.amberSoft,
              child: Icon(Icons.celebration_rounded, color: AppTheme.amber),
            ),
            title: str(holiday["occasion"]).isEmpty
                ? "Holiday"
                : str(holiday["occasion"]),
            subtitle: fmtDayShort(holiday["date"]),
            onTap: () => onOpen(const HolidaysScreen()),
          ),
        ],
      ],
    );
  }
}

/// Natural-height tiles keep labels readable on narrow phones and with larger
/// system text; no fixed aspect ratio can clip their contents.
class _DashboardGrid extends StatelessWidget {
  final List<Widget> children;
  final int columns;
  const _DashboardGrid({required this.children, this.columns = 3});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final textScale = MediaQuery.textScalerOf(context).scale(12) / 12;
        final count = constraints.maxWidth < 280 || textScale > 1.6
            ? 1
            : columns == 3 && (constraints.maxWidth < 340 || textScale > 1.2)
            ? 2
            : columns;
        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final child in children)
              SizedBox(
                width: (constraints.maxWidth - (count - 1) * 10) / count,
                child: child,
              ),
          ],
        );
      },
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
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppTheme.primarySoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 15, color: AppTheme.indigo),
              ),
              const SizedBox(height: 10),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                  color: AppTheme.navy,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall
                    ?.copyWith(fontSize: 10.5),
              ),
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
  const DutyCard({
    super.key,
    required this.attendance,
    required this.onChanged,
  });

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
    setState(() => _busy = true);
    try {
      final agendas = (await ApiClient.instance.masters([
        "work-agenda",
      ]))["work-agenda"]!;
      if (!mounted) return;
      final agenda = await showModalBottomSheet<String>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => _AgendaSheet(options: agendas),
      );
      if (agenda == null || !mounted) return;
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
        content: const Text(
          "This ends your working day and stops location sharing.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancel"),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Punch out"),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      Json body = {};
      try {
        final position = await AppPermissions.currentPosition();
        body = {
          "lat": position.latitude,
          "lng": position.longitude,
          "accuracy": position.accuracy,
        };
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
    final minutes = inAt == null
        ? 0
        : (outAt ?? DateTime.now()).difference(inAt).inMinutes;

    final (status, title, detail) = switch ((inAt, outAt)) {
      (null, _) => (
        "Not started",
        "Ready for your day?",
        "Punch in to begin your field work.",
      ),
      (_, null) => (
        "On duty",
        fmtDuration(minutes),
        "Working since ${fmtTime(inAt)}",
      ),
      _ => (
        "Day complete",
        fmtDuration(minutes),
        "${fmtTime(inAt)} – ${fmtTime(outAt)} · ${(widget.attendance?["distanceKm"] ?? 0)} km covered",
      ),
    };

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppTheme.brandGradient,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: 0.12),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.fingerprint_rounded,
                color: AppTheme.onNavyMuted,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  "TODAY'S ATTENDANCE",
                  style: TextStyle(
                    color: AppTheme.onNavyMuted,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: _onDuty
                            ? AppTheme.mint
                            : AppTheme.onNavyMuted,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      status,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                fmtDayShort(DateTime.now().toIso8601String()),
                style: const TextStyle(color: AppTheme.onNavyMuted, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: TextStyle(
              color: Colors.white,
              fontSize: inAt == null ? 18 : 26,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            detail,
            style: const TextStyle(color: AppTheme.onNavyMuted, fontSize: 12),
          ),
          if (str(widget.attendance?["workAgenda"]).isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              "Agenda · ${widget.attendance!["workAgenda"]}",
              style: const TextStyle(color: AppTheme.onNavyMuted, fontSize: 11),
            ),
          ],
          ValueListenableBuilder<bool>(
            valueListenable: LocationTracker.instance.running,
            builder: (_, running, _) => running
                ? const Padding(
                    padding: EdgeInsets.only(top: 10),
                    child: Row(
                      children: [
                        Icon(
                          Icons.gps_fixed_rounded,
                          color: AppTheme.mint,
                          size: 14,
                        ),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            "Location sharing is active",
                            style: TextStyle(
                              color: AppTheme.mint,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          if (outAt == null) ...[
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.navy,
                  disabledBackgroundColor: Colors.white.withValues(alpha: 0.18),
                  disabledForegroundColor: Colors.white70,
                  minimumSize: const Size(48, 48),
                ),
                onPressed: _busy ? null : (inAt == null ? _punchIn : _punchOut),
                icon: _busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Icon(
                        inAt == null
                            ? Icons.login_rounded
                            : Icons.logout_rounded,
                        size: 18,
                      ),
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
    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              "Today's work agenda",
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              "Your location is recorded with your punch-in.",
              style: Theme.of(context).textTheme.bodySmall,
            ),
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
                decoration: const InputDecoration(
                  labelText: "Agenda (e.g. Field work, Meeting)",
                ),
                onChanged: (v) => setState(() => _agenda = v.trim()),
              ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => Navigator.pop(
                context,
                _agenda.isEmpty ? "Field work" : _agenda,
              ),
              icon: const Icon(Icons.login_rounded),
              label: const Text("Punch in now"),
            ),
          ],
        ),
      ),
    );
  }
}
