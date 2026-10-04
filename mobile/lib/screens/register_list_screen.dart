import "dart:async";

import "package:flutter/material.dart";

import "../models/registration.dart";
import "../services/api_client.dart";
import "../widgets/status_chip.dart";
import "new_register_form_screen.dart";

const _pollInterval = Duration(seconds: 10);

class RegisterListScreen extends StatefulWidget {
  final ApiClient apiClient;

  const RegisterListScreen({super.key, required this.apiClient});

  @override
  State<RegisterListScreen> createState() => _RegisterListScreenState();
}

class _RegisterListScreenState extends State<RegisterListScreen> {
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

  // Runs in the background on a timer so the list stays current without the
  // user having to pull-to-refresh; swaps the future in only once the new
  // data has arrived, so there's no loading flicker.
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

  Future<void> _openNewRegisterForm() async {
    final created = await Navigator.of(context).push<Registration>(
      MaterialPageRoute(
        builder: (_) => NewRegisterFormScreen(apiClient: widget.apiClient),
      ),
    );

    if (created == null || !mounted) return;

    await _refresh();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          "Submitted for approval. Doctor ID: ${created.doctorId}",
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              FilledButton.icon(
                onPressed: _openNewRegisterForm,
                icon: const Icon(Icons.add),
                label: const Text("New"),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
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
                          child: Text(
                            'No registrations yet. Tap "New" to submit one.',
                          ),
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
          ),
        ),
      ],
    );
  }
}
