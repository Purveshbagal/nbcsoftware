import "package:flutter/material.dart";
import "package:intl/intl.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

class HolidaysScreen extends StatelessWidget {
  const HolidaysScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Holidays ${DateTime.now().year}")),
      body: LoadView<List<Json>>(
        load: () => ApiClient.instance.list("/holidays"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.event_rounded, message: "No holidays published for your zone yet.")]);
          }
          final today = todayKey();
          final byMonth = <String, List<Json>>{};
          for (final h in items) {
            final date = DateTime.tryParse(str(h["date"]));
            final key = date == null ? "Other" : DateFormat("MMMM").format(date);
            byMonth.putIfAbsent(key, () => []).add(h);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            children: [
              for (final entry in byMonth.entries) ...[
                SectionLabel(entry.key),
                for (final h in entry.value) ...[
                  Opacity(
                    opacity: str(h["date"]).compareTo(today) < 0 ? 0.5 : 1,
                    child: RecordTile(
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFFFFF0D9),
                        child: Text(
                          str(h["date"]).length >= 10 ? str(h["date"]).substring(8, 10) : "",
                          style: const TextStyle(color: AppTheme.amber, fontWeight: FontWeight.w700),
                        ),
                      ),
                      title: str(h["occasion"]).isEmpty ? "Holiday" : str(h["occasion"]),
                      subtitle: fmtDayShort(h["date"]),
                      meta: switch (h["calendarType"]) {
                        "restricted" => "Restricted holiday",
                        "work" => "Working day",
                        _ => "",
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ],
            ],
          );
        },
      ),
    );
  }
}
