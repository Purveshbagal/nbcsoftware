import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// This month's target against what has been done so far.
class TargetsScreen extends StatelessWidget {
  const TargetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My targets")),
      body: LoadView<Json>(
        load: () => ApiClient.instance.get("/targets"),
        builder: (context, data) {
          final target = data["target"] as Json?;
          final achieved = (data["achieved"] as Json?) ?? {};
          final rows = [
            ("Doctor calls", (target?["doctorVisits"] as num?) ?? 0, (achieved["doctorVisits"] as num?) ?? 0, false),
            ("Chemist calls", (target?["chemistVisits"] as num?) ?? 0, (achieved["chemistVisits"] as num?) ?? 0, false),
            ("POB", (target?["pobValue"] as num?) ?? 0, (achieved["pobValue"] as num?) ?? 0, true),
          ];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (target == null)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text("No target has been set for you this month yet. Your progress is shown anyway."),
                ),
              for (final (label, goal, done, money) in rows) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(label, style: Theme.of(context).textTheme.titleMedium),
                            const Spacer(),
                            Text(
                              money
                                  ? "${fmtRupees(done)}${goal > 0 ? " / ${fmtRupees(goal)}" : ""}"
                                  : "$done${goal > 0 ? " / $goal" : ""}",
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            minHeight: 10,
                            value: goal > 0 ? (done / goal).clamp(0, 1).toDouble() : 0,
                            backgroundColor: const Color(0xFFEDEDF7),
                            color: goal > 0 && done >= goal ? AppTheme.emerald : AppTheme.indigo,
                          ),
                        ),
                        if (goal > 0) ...[
                          const SizedBox(height: 6),
                          Text("${(done / goal * 100).clamp(0, 999).round()}% achieved", style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ],
          );
        },
      ),
    );
  }
}
