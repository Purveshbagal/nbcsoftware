import "dart:async";

import "package:flutter/material.dart";

import "../models/registration.dart";
import "../services/api_client.dart";
import "../widgets/status_chip.dart";

const _pollInterval = Duration(seconds: 10);

class ApprovalStatusScreen extends StatefulWidget {
  final ApiClient apiClient;

  const ApprovalStatusScreen({super.key, required this.apiClient});

  @override
  State<ApprovalStatusScreen> createState() => _ApprovalStatusScreenState();
}

class _ApprovalStatusScreenState extends State<ApprovalStatusScreen> {
  late Future<List<Registration>> _future;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _future = widget.apiClient.fetchRegistrations();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _silentRefresh());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final next = widget.apiClient.fetchRegistrations();
    setState(() {
      _future = next;
    });
    await next;
  }

  // Runs on a timer so an admin's approve/reject decision shows up here
  // without the user having to pull-to-refresh.
  Future<void> _silentRefresh() async {
    try {
      final registrations = await widget.apiClient.fetchRegistrations();
      if (!mounted) return;
      setState(() {
        _future = Future.value(registrations);
      });
    } catch (_) {
      // Ignore transient polling failures; the next tick will retry.
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<Registration>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text("Failed to load: ${snapshot.error}"),
                ),
              ],
            );
          }

          final registrations = snapshot.data!;
          if (registrations.isEmpty) {
            return ListView(
              children: const [
                Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(
                    child: Text("No registrations submitted yet."),
                  ),
                ),
              ],
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: registrations.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final registration = registrations[index];
              return Card(
                child: ListTile(
                  title: Text(registration.doctorName),
                  subtitle: Text(
                    "${registration.doctorId} · Reg #${registration.registrationNumber}",
                  ),
                  trailing: StatusChip(status: registration.status),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
