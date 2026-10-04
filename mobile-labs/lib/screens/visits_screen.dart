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

  Future<List<Json>> _load() =>
      ApiClient.instance.list("/visits", query: _todayOnly ? {"date": todayKey()} : null);

  Future<void> _newVisit() async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const NewVisitScreen()));
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Visits"),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: SegmentedButton<bool>(
              showSelectedIcon: false,
              style: const ButtonStyle(visualDensity: VisualDensity.compact),
              segments: const [
                ButtonSegment(value: true, label: Text("Today")),
                ButtonSegment(value: false, label: Text("All")),
              ],
              selected: {_todayOnly},
              onSelectionChanged: (s) {
                setState(() => _todayOnly = s.first);
                _loader.currentState?.reload();
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _newVisit,
        icon: const Icon(Icons.add_location_alt_rounded),
        label: const Text("New visit"),
      ),
      body: LoadView<List<Json>>(
        key: _loader,
        load: _load,
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(
              children: [
                EmptyState(
                  icon: Icons.place_rounded,
                  message: _todayOnly ? "No visits logged today.\nTap “New visit” after each call." : "No visits yet.",
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final visit = items[i];
              final isDoctor = visit["visitType"] != "firm";
              final subject = isDoctor ? str(visit["doctor"]) : str(visit["firm"]);
              final details = [
                str(visit["callObjective"]),
                if ((visit["pobValue"] ?? 0) > 0) "POB ${fmtRupees(visit["pobValue"] as num)}",
                if (str(visit["skippedReason"]).isNotEmpty) visit["skippedReason"],
              ].where((s) => s.toString().isNotEmpty).join(" · ");
              return RecordTile(
                leading: CircleAvatar(
                  backgroundColor: isDoctor ? const Color(0xFFE8E8FB) : const Color(0xFFDDF5EA),
                  child: Icon(
                    isDoctor ? Icons.medical_services_rounded : Icons.storefront_rounded,
                    color: isDoctor ? AppTheme.indigo : AppTheme.emerald,
                  ),
                ),
                title: subject,
                subtitle: details,
                meta: "${fmtDate(visit["visitDate"])} · ${fmtTime(visit["checkInAt"] ?? visit["createdAt"])}"
                    "${visit["geo"] == null ? " · no GPS" : ""}",
                status: str(visit["status"]),
              );
            },
          );
        },
      ),
    );
  }
}
