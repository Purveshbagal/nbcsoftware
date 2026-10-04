import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// Tasks and reminders the office assigned to this employee.
class RemindersScreen extends StatefulWidget {
  const RemindersScreen({super.key});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  final _loader = GlobalKey<LoadViewState<List<Json>>>();
  final Set<String> _busy = {};

  Future<void> _toggle(Json item) async {
    final id = str(item["_id"]);
    setState(() => _busy.add(id));
    try {
      await ApiClient.instance.patch("/reminders/$id", {"status": item["status"] == "done" ? "open" : "done"});
      await _loader.currentState?.reload();
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy.remove(id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Tasks & reminders")),
      body: LoadView<List<Json>>(
        key: _loader,
        load: () => ApiClient.instance.list("/reminders"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.task_alt_rounded, message: "Nothing assigned to you.")]);
          }
          final today = todayKey();
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final r = items[i];
              final done = r["status"] == "done";
              final overdue = !done && str(r["date"]).compareTo(today) < 0;
              return Card(
                child: CheckboxListTile(
                  value: done,
                  onChanged: _busy.contains(str(r["_id"])) ? null : (_) => _toggle(r),
                  controlAffinity: ListTileControlAffinity.leading,
                  title: Text(
                    str(r["title"]),
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      decoration: done ? TextDecoration.lineThrough : null,
                      color: done ? AppTheme.muted : null,
                    ),
                  ),
                  subtitle: Text(
                    [fmtDate(r["date"]), str(r["notes"])].where((s) => s.isNotEmpty).join("\n"),
                    style: TextStyle(color: overdue ? AppTheme.danger : AppTheme.muted),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
