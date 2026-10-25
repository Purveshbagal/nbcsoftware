import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";
import "visit_detail_screen.dart";
import "visit_plan_screen.dart";

/// Visit List Screen
/// Shows visits in three tabs: Planned, Open, Closed
class VisitListScreen extends StatefulWidget {
  const VisitListScreen({super.key});

  @override
  State<VisitListScreen> createState() => _VisitListScreenState();
}

class _VisitListScreenState extends State<VisitListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, List<dynamic>> _visits = {
    "planned": [],
    "open": [],
    "closed": [],
  };
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadVisits();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadVisits() async {
    setState(() => _loading = true);
    try {
      final planned = await ApiClient.instance.get("/visits?status=planned");
      final open = await ApiClient.instance.get("/visits?status=open");
      final closed = await ApiClient.instance.get("/visits?status=closed");

      setState(() {
        _visits = {
          "planned": planned["items"] ?? [],
          "open": open["items"] ?? [],
          "closed": closed["items"] ?? [],
        };
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        showError(context, "Failed to load visits: $e");
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _navigateToPlanVisit() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const VisitPlanScreen()),
    );
    if (result == true) {
      _loadVisits(); // Refresh list
    }
  }

  Future<void> _navigateToVisitDetail(dynamic visit) async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VisitDetailScreen(visitId: visit["_id"]),
      ),
    );
    if (result == true) {
      _loadVisits(); // Refresh list
    }
  }

  Widget _buildVisitCard(dynamic visit, String status) {
    final doctor = visit["doctor"];
    final doctorName = doctor is Map ? doctor["name"] ?? "Unknown Doctor" : doctor?.toString() ?? "Unknown Doctor";
    final hospitalName = doctor is Map ? doctor["hospitalName"] ?? "N/A" : visit["clinicAddress"] ?? "";
    final plannedDate = visit["plannedDate"] != null
        ? DateTime.parse(visit["plannedDate"])
        : null;
    final checkedInAt = visit["checkInAt"] != null
        ? DateTime.parse(visit["checkInAt"])
        : null;
    final closedAt = visit["checkOutAt"] != null
        ? DateTime.parse(visit["checkOutAt"])
        : null;

    Color statusColor;
    String statusText;
    IconData statusIcon;

    switch (status) {
      case "planned":
        statusColor = Colors.blue;
        statusText = "Planned";
        statusIcon = Icons.calendar_today;
        break;
      case "open":
        statusColor = Colors.orange;
        statusText = "Open";
        statusIcon = Icons.access_time;
        break;
      case "closed":
        statusColor = Colors.green;
        statusText = "Closed";
        statusIcon = Icons.check_circle;
        break;
      default:
        statusColor = Colors.grey;
        statusText = "Unknown";
        statusIcon = Icons.help;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _navigateToVisitDetail(visit),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctorName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        hospitalName,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: Colors.grey.shade300),
            const SizedBox(height: 8),
            if (plannedDate != null)
              _buildInfoRow(
                Icons.calendar_today,
                "Planned",
                "${plannedDate.day}/${plannedDate.month}/${plannedDate.year}",
              ),
            if (checkedInAt != null)
              _buildInfoRow(
                Icons.login,
                "Checked In",
                "${checkedInAt.hour}:${checkedInAt.minute.toString().padLeft(2, '0')}",
              ),
            if (closedAt != null)
              _buildInfoRow(
                Icons.check,
                "Closed",
                "${closedAt.day}/${closedAt.month}/${closedAt.year} ${closedAt.hour}:${closedAt.minute.toString().padLeft(2, '0')}",
              ),
            if (visit["modeOfTransport"] != null)
              _buildInfoRow(
                Icons.directions_car,
                "Transport",
                visit["modeOfTransport"],
              ),
          ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.indigo),
          const SizedBox(width: 8),
          Text(
            "$label:",
            style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(String status) {
    final visits = _visits[status] ?? [];

    if (visits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              status == "planned"
                  ? Icons.calendar_today
                  : status == "open"
                      ? Icons.access_time
                      : Icons.check_circle,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              "No ${status} visits",
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadVisits,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: visits.length,
        itemBuilder: (context, index) {
          return _buildVisitCard(visits[index], status);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Visits"),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: "Planned", icon: Icon(Icons.calendar_today, size: 18)),
            Tab(text: "Open", icon: Icon(Icons.access_time, size: 18)),
            Tab(text: "Closed", icon: Icon(Icons.check_circle, size: 18)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildTab("planned"),
                _buildTab("open"),
                _buildTab("closed"),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToPlanVisit,
        icon: const Icon(Icons.add),
        label: const Text("Plan Visit"),
        backgroundColor: AppTheme.indigo,
      ),
    );
  }
}
