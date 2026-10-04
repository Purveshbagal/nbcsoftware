import "package:flutter/material.dart";
import "package:permission_handler/permission_handler.dart";

import "../app_theme.dart";
import "../services/permissions.dart";

class _Step {
  final IconData icon;
  final String title;
  final String detail;
  final bool essential;
  final Future<bool> Function() check;
  final Future<bool> Function() request;
  const _Step(this.icon, this.title, this.detail, this.essential, this.check, this.request);
}

/// First launch: explain and ask for each permission in turn. Location is
/// the only one the app cannot work without.
class PermissionsScreen extends StatefulWidget {
  final Future<void> Function() onDone;
  /// Opened again from the profile screen, where "Continue" just closes it.
  final bool revisit;
  const PermissionsScreen({super.key, required this.onDone, this.revisit = false});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> with WidgetsBindingObserver {
  static final _steps = [
    _Step(
      Icons.my_location_rounded,
      "Location",
      "Needed to punch in and out and to log visits where they happen.",
      true,
      AppPermissions.locationGranted,
      AppPermissions.requestLocation,
    ),
    _Step(
      Icons.share_location_rounded,
      "Location all the time",
      "Keeps your route updating while the phone is in your pocket. Only shared between punch-in and punch-out. Choose \"Allow all the time\".",
      true,
      AppPermissions.backgroundLocationGranted,
      AppPermissions.requestBackgroundLocation,
    ),
    _Step(
      Icons.notifications_active_rounded,
      "Notifications",
      "Shows the on-duty notification so you always know when location is being shared.",
      false,
      AppPermissions.notificationsGranted,
      AppPermissions.requestNotifications,
    ),
    _Step(
      Icons.photo_library_rounded,
      "Storage & photos",
      "Lets you attach bills, prescriptions and survey photos.",
      false,
      AppPermissions.storageGranted,
      AppPermissions.requestStorage,
    ),
    _Step(
      Icons.battery_charging_full_rounded,
      "Ignore battery optimisation",
      "Stops the phone from pausing tracking during your working day.",
      false,
      AppPermissions.batteryExemptionGranted,
      AppPermissions.requestBatteryExemption,
    ),
  ];

  final Map<int, bool> _granted = {};
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Coming back from the Settings app — pick up what changed there.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refresh();
  }

  Future<void> _refresh() async {
    for (var i = 0; i < _steps.length; i++) {
      final ok = await _steps[i].check();
      if (mounted) setState(() => _granted[i] = ok);
    }
  }

  Future<void> _request(int index) async {
    setState(() => _busy = true);
    try {
      final ok = await _steps[index].request();
      if (!ok && index <= 1) {
        final permanent = await Permission.locationWhenInUse.isPermanentlyDenied;
        if (permanent && mounted) await openAppSettings();
      }
    } finally {
      await _refresh();
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _allowAll() async {
    for (var i = 0; i < _steps.length; i++) {
      if (_granted[i] == true) continue;
      await _request(i);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationOk = _granted[0] == true;
    final allOk = List.generate(_steps.length, (i) => _granted[i] == true).every((g) => g);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: widget.revisit ? AppBar(title: const Text("Permissions")) : null,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
          children: [
            if (!widget.revisit) ...[
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: AppTheme.indigo, borderRadius: BorderRadius.circular(16)),
                child: const Icon(Icons.biotech_rounded, color: Colors.white, size: 30),
              ),
              const SizedBox(height: 20),
              Text("Welcome to NBC Labs", style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                "Before you start, allow the app to use these. Your location is shared with the office only while you are punched in.",
                style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.muted),
              ),
              const SizedBox(height: 24),
            ],
            for (var i = 0; i < _steps.length; i++) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(_steps[i].icon, color: AppTheme.indigo),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _steps[i].essential ? "${_steps[i].title} · required" : _steps[i].title,
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(_steps[i].detail, style: theme.textTheme.bodySmall),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      _granted[i] == true
                          ? const Padding(
                              padding: EdgeInsets.all(8),
                              child: Icon(Icons.check_circle_rounded, color: AppTheme.emerald),
                            )
                          : TextButton(onPressed: _busy ? null : () => _request(i), child: const Text("Allow")),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
            const SizedBox(height: 16),
            if (!allOk)
              FilledButton(onPressed: _busy ? null : _allowAll, child: const Text("Allow all")),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: locationOk ? widget.onDone : null,
              child: Text(widget.revisit ? "Done" : (allOk ? "Continue" : "Continue with these")),
            ),
            if (!locationOk)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  "Location is required to continue.",
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
