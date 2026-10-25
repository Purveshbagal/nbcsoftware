import "package:flutter/material.dart";
import "package:intl/intl.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final _loader = GlobalKey<LoadViewState<Json>>();
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);

  Future<Json> _load() => ApiClient.instance.get(
    "/attendance",
    query: {"month": DateFormat("yyyy-MM").format(_month)},
  );

  void _shift(int delta) {
    final next = DateTime(_month.year, _month.month + delta);
    if (next.isAfter(DateTime.now())) return;
    setState(() => _month = next);
    _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final isCurrent =
        _month.year == DateTime.now().year &&
        _month.month == DateTime.now().month;
    return Scaffold(
      appBar: AppBar(title: const Text("Attendance")),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                child: Row(
                  children: [
                    IconButton(
                      tooltip: "Previous month",
                      onPressed: () => _shift(-1),
                      icon: const Icon(Icons.chevron_left_rounded),
                    ),
                    Expanded(
                      child: Column(
                        children: [
                          Text(
                            "MONTHLY OVERVIEW",
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(
                                  color: AppTheme.muted,
                                  letterSpacing: 0.8,
                                ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            DateFormat("MMMM yyyy").format(_month),
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: "Next month",
                      onPressed: isCurrent ? null : () => _shift(1),
                      icon: const Icon(Icons.chevron_right_rounded),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: LoadView<Json>(
              key: _loader,
              load: _load,
              builder: (context, data) {
                final items = ((data["items"] as List?) ?? const [])
                    .cast<Json>();
                final totalMinutes =
                    (data["totalMinutes"] as num?)?.toInt() ?? 0;
                final km = items.fold<num>(
                  0,
                  (sum, r) => sum + ((r["distanceKm"] as num?) ?? 0),
                );
                final halfDays = items
                    .where((r) => r["status"] == "half-day")
                    .length;

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                  children: [
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final largeText =
                            MediaQuery.textScalerOf(context).scale(13) > 20;
                        final width = largeText
                            ? constraints.maxWidth
                            : (constraints.maxWidth - 10) / 2;
                        return Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _Summary(
                              label: "Days recorded",
                              value: "${items.length}",
                              icon: Icons.event_available_rounded,
                              color: AppTheme.indigo,
                              width: width,
                            ),
                            _Summary(
                              label: "Working time",
                              value: fmtDuration(totalMinutes),
                              icon: Icons.schedule_rounded,
                              color: AppTheme.emerald,
                              width: width,
                            ),
                            _Summary(
                              label: "Distance",
                              value: "${km.toStringAsFixed(1)} km",
                              icon: Icons.route_rounded,
                              color: AppTheme.indigo,
                              width: width,
                            ),
                            _Summary(
                              label: "Half days",
                              value: "$halfDays",
                              icon: Icons.timelapse_rounded,
                              color: AppTheme.amber,
                              width: width,
                            ),
                          ],
                        );
                      },
                    ),
                    const SectionLabel("Daily records"),
                    if (items.isEmpty)
                      const Card(
                        child: EmptyState(
                          icon: Icons.event_note_rounded,
                          message: "No attendance this month.\nYour recorded workdays will appear here.",
                        ),
                      )
                    else
                      for (final row in items) ...[
                        _DayTile(row: row),
                        const SizedBox(height: 10),
                      ],
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final double width;

  const _Summary({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.width,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 19, color: color),
              const SizedBox(height: 12),
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppTheme.ink,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(label, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _DayTile extends StatelessWidget {
  final Json row;
  const _DayTile({required this.row});

  @override
  Widget build(BuildContext context) {
    final inAt = row["punchIn"]?["at"];
    final outAt = row["punchOut"]?["at"];
    final date = DateTime.tryParse(str(row["date"]));
    final minutes = (row["workingMinutes"] as num?)?.toInt() ?? 0;
    final open = inAt != null && outAt == null;
    final agenda = str(row["workAgenda"]);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 3),
              decoration: BoxDecoration(
                color: AppTheme.primarySoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    date == null ? "–" : DateFormat("d").format(date),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.indigo,
                    ),
                  ),
                  Text(
                    date == null ? "" : DateFormat("EEE").format(date),
                    style: Theme.of(context).textTheme.labelSmall
                        ?.copyWith(color: AppTheme.indigo),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "${fmtTime(inAt)} – ${open ? "On duty" : fmtTime(outAt)}",
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  if (!open) ...[
                    const SizedBox(height: 4),
                    Text(
                      "${fmtDuration(minutes)}  ·  ${row["distanceKm"] ?? 0} km",
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                  if (agenda.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(agenda, style: Theme.of(context).textTheme.bodySmall),
                  ],
                  const SizedBox(height: 8),
                  StatusChip(open ? "on duty" : str(row["status"])),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
