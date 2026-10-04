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

  Future<Json> _load() =>
      ApiClient.instance.get("/attendance", query: {"month": DateFormat("yyyy-MM").format(_month)});

  void _shift(int delta) {
    final next = DateTime(_month.year, _month.month + delta);
    if (next.isAfter(DateTime.now())) return;
    setState(() => _month = next);
    _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    final isCurrent = _month.year == DateTime.now().year && _month.month == DateTime.now().month;
    return Scaffold(
      appBar: AppBar(title: const Text("Attendance")),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                IconButton(onPressed: () => _shift(-1), icon: const Icon(Icons.chevron_left_rounded)),
                Expanded(
                  child: Text(
                    DateFormat("MMMM yyyy").format(_month),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                IconButton(
                  onPressed: isCurrent ? null : () => _shift(1),
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ],
            ),
          ),
          Expanded(
            child: LoadView<Json>(
              key: _loader,
              load: _load,
              builder: (context, data) {
                final items = ((data["items"] as List?) ?? const []).cast<Json>();
                final totalMinutes = (data["totalMinutes"] as num?)?.toInt() ?? 0;
                final km = items.fold<num>(0, (sum, r) => sum + ((r["distanceKm"] as num?) ?? 0));
                final halfDays = items.where((r) => r["status"] == "half-day").length;

                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                  children: [
                    Row(
                      children: [
                        _Summary("Days", "${items.length}", AppTheme.indigo),
                        const SizedBox(width: 8),
                        _Summary("Hours", fmtDuration(totalMinutes), AppTheme.emerald),
                        const SizedBox(width: 8),
                        _Summary("Distance", "${km.toStringAsFixed(1)} km", const Color(0xFF8B5CF6)),
                        const SizedBox(width: 8),
                        _Summary("Half days", "$halfDays", AppTheme.amber),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (items.isEmpty)
                      const EmptyState(icon: Icons.event_busy_rounded, message: "No attendance recorded this month.")
                    else
                      for (final row in items) ...[
                        _DayTile(row: row),
                        const SizedBox(height: 8),
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
  final Color color;
  const _Summary(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14)),
        child: Column(
          children: [
            FittedBox(child: Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color))),
            const SizedBox(height: 2),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 50,
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: BoxDecoration(color: const Color(0xFFF0F0FC), borderRadius: BorderRadius.circular(10)),
              child: Column(
                children: [
                  Text(date == null ? "" : DateFormat("d").format(date), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  Text(date == null ? "" : DateFormat("EEE").format(date), style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("${fmtTime(inAt)}  →  ${open ? "on duty" : fmtTime(outAt)}", style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(
                    [
                      if (!open) fmtDuration(minutes),
                      if (!open) "${row["distanceKm"] ?? 0} km",
                      str(row["workAgenda"]),
                    ].where((s) => s.isNotEmpty).join(" · "),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            StatusChip(open ? "on duty" : str(row["status"])),
          ],
        ),
      ),
    );
  }
}
