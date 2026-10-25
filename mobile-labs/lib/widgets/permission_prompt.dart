import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/permissions.dart";

/// First-launch popup: explains the two permissions, then "Allow" brings up
/// the system prompts for each.
Future<void> showPermissionPrompt(BuildContext context) {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (context) => PopScope(
      canPop: false,
      child: AlertDialog(
        icon: const Icon(Icons.verified_user_rounded, color: AppTheme.indigo, size: 28),
        title: const Text("Allow permissions"),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _Row(
              icon: Icons.location_on_rounded,
              title: "Location",
              detail: "To punch in and out and to record visits.",
            ),
            SizedBox(height: 14),
            _Row(
              icon: Icons.folder_rounded,
              title: "Storage",
              detail: "To save files you download from the app.",
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () async {
                await AppPermissions.requestAll();
                if (context.mounted) Navigator.of(context).pop();
              },
              child: const Text("Allow"),
            ),
          ),
        ],
      ),
    ),
  );
}

class _Row extends StatelessWidget {
  final IconData icon;
  final String title;
  final String detail;
  const _Row({required this.icon, required this.title, required this.detail});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: AppTheme.primarySoft,
          child: Icon(icon, color: AppTheme.indigo, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 2),
              Text(detail, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}
