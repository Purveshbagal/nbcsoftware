import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// E-detailing presentations and media to show doctors.
class MediaScreen extends StatelessWidget {
  const MediaScreen({super.key});

  IconData _icon(String type) {
    final t = type.toLowerCase();
    if (t.contains("pdf")) return Icons.picture_as_pdf_rounded;
    if (t.contains("video") || t.contains("mp4")) return Icons.play_circle_rounded;
    if (t.contains("image") || t.contains("jpg") || t.contains("png")) return Icons.image_rounded;
    return Icons.slideshow_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("E-detailing")),
      body: LoadView<List<Json>>(
        load: () => ApiClient.instance.list("/media"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.slideshow_rounded, message: "No presentations shared yet.")]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = items[i];
              final url = str(m["url"]);
              return RecordTile(
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFFE8E8FB),
                  child: Icon(_icon(str(m["fileType"]).isEmpty ? url : str(m["fileType"])), color: AppTheme.indigo),
                ),
                title: str(m["title"]),
                subtitle: str(m["description"]),
                meta: [str(m["campaign"]), m["kind"] == "presentation" ? "Presentation" : "Media"].where((s) => s.isNotEmpty).join(" · "),
                onTap: url.isEmpty
                    ? null
                    : () async {
                        final uri = Uri.tryParse(url);
                        if (uri == null || !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
                          if (context.mounted) showMessage(context, "Could not open this file.");
                        }
                      },
              );
            },
          );
        },
      ),
    );
  }
}
