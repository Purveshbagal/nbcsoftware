import "package:flutter/material.dart";

class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case "approved":
        color = const Color(0xFF087F68);
        break;
      case "rejected":
        color = const Color(0xFFBE3144);
        break;
      default:
        color = const Color(0xFF97600C);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        status.isEmpty
            ? "Unknown"
            : "${status[0].toUpperCase()}${status.substring(1)}",
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}
