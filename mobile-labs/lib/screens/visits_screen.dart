import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";
import "new_visit_screen.dart";

class VisitsScreen extends StatefulWidget {
  const VisitsScreen({super.key});

  @override
  State<VisitsScreen> createState() => _VisitsScreenState();
}

class _VisitsScreenState extends State<VisitsScreen> {
  final _loader = GlobalKey<LoadViewState<List<Json>>>();
  bool _todayOnly = true;

  Future<List<Json>> _load() => ApiClient.instance.list(
    "/visits",
    query: _todayOnly ? {"date": todayKey()} : null,
  );

  Future<void> _newVisit() async {
    final saved = await Navigator.of(context)
        .push<bool>(MaterialPageRoute(builder: (_) => const NewVisitScreen()));
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Visits")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _newVisit,
        icon: const Icon(Icons.add_location_alt_rounded, size: 20),
        label: const Text("New visit"),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Your doctor and firm calls, in one place.",
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: SegmentedButton<bool>(
                    showSelectedIcon: false,
                    expandedInsets: EdgeInsets.zero,
                    segments: const [
                      ButtonSegment(value: true, label: Text("Today")),
                      ButtonSegment(value: false, label: Text("All visits")),
                    ],
                    selected: {_todayOnly},
                    onSelectionChanged: (selection) {
                      if (_todayOnly == selection.first) return;
                      setState(() => _todayOnly = selection.first);
                      _loader.currentState?.reload();
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: LoadView<List<Json>>(
              key: _loader,
              load: _load,
              builder: (context, items) {
                final doctors = items
                    .where((item) => item["visitType"] != "firm")
                    .length;
                return ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 104),
                  itemCount: items.isEmpty ? 2 : items.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _VisitOverview(
                          count: items.length,
                          doctors: doctors,
                          firms: items.length - doctors,
                          todayOnly: _todayOnly,
                        ),
                      );
                    }
                    if (items.isEmpty) {
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: Column(
                            children: [
                              EmptyState(
                                icon: Icons.add_location_alt_outlined,
                                message: _todayOnly
                                    ? "No visits logged today.\nRecord your first call to get started."
                                    : "Your visit history starts here.\nRecord a doctor or firm call.",
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                child: OutlinedButton.icon(
                                  onPressed: _newVisit,
                                  icon: const Icon(Icons.add_rounded, size: 18),
                                  label: const Text("Record a visit"),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    final visit = items[index - 1];
                    final isDoctor = visit["visitType"] != "firm";
                    final subject = isDoctor
                        ? str(visit["doctor"])
                        : str(visit["firm"]);
                    final details = [
                      str(visit["callObjective"]),
                      if ((visit["pobValue"] ?? 0) > 0)
                        "POB ${fmtRupees(visit["pobValue"] as num)}",
                      if (str(visit["skippedReason"]).isNotEmpty)
                        str(visit["skippedReason"]),
                    ].where((detail) => detail.isNotEmpty).join(" · ");

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: RecordTile(
                        leading: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: isDoctor
                                ? AppTheme.primarySoft
                                : AppTheme.emeraldSoft,
                            borderRadius: BorderRadius.circular(11),
                          ),
                          child: Icon(
                            isDoctor
                                ? Icons.medical_services_outlined
                                : Icons.storefront_rounded,
                            size: 19,
                            color: isDoctor
                                ? AppTheme.indigo
                                : AppTheme.emerald,
                          ),
                        ),
                        title: subject.isEmpty
                            ? (isDoctor ? "Doctor visit" : "Firm visit")
                            : subject,
                        subtitle: details,
                        meta:
                            "${fmtDate(visit["visitDate"])} · ${fmtTime(visit["checkInAt"] ?? visit["createdAt"])}"
                            "${visit["geo"] == null ? " · No GPS" : ""}",
                        status: str(visit["status"]),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _VisitOverview extends StatelessWidget {
  final int count;
  final int doctors;
  final int firms;
  final bool todayOnly;

  const _VisitOverview({
    required this.count,
    required this.doctors,
    required this.firms,
    required this.todayOnly,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primarySoft,
        border: Border.all(color: AppTheme.indigo.withValues(alpha: 0.10)),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            todayOnly ? "TODAY'S ACTIVITY" : "VISIT HISTORY",
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppTheme.indigo,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "$count ${count == 1 ? "visit" : "visits"} logged",
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _TypeCount(
                icon: Icons.medical_services_outlined,
                count: doctors,
                label: "Doctor",
              ),
              _TypeCount(
                icon: Icons.storefront_rounded,
                count: firms,
                label: "Firm",
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TypeCount extends StatelessWidget {
  final IconData icon;
  final int count;
  final String label;

  const _TypeCount({
    required this.icon,
    required this.count,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: AppTheme.muted),
        const SizedBox(width: 5),
        Flexible(
          child: Text(
            "$count ${count == 1 ? label.toLowerCase() : "${label.toLowerCase()}s"}",
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
