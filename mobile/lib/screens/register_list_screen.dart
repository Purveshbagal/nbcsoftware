import "dart:async";

import "package:flutter/material.dart";

import "../models/payment.dart";
import "../services/api_client.dart";
import "../widgets/status_chip.dart";
import "doctor_selection_screen.dart";

const _pollInterval = Duration(seconds: 10);

class RegisterListScreen extends StatefulWidget {
  final ApiClient apiClient;

  const RegisterListScreen({super.key, required this.apiClient});

  @override
  State<RegisterListScreen> createState() => _RegisterListScreenState();
}

class _RegisterListScreenState extends State<RegisterListScreen> {
  late Future<List<Payment>> _future;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _future = widget.apiClient.fetchPayments();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _silentRefresh());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final next = widget.apiClient.fetchPayments();
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
      final payments = await widget.apiClient.fetchPayments();
      if (!mounted) return;
      setState(() {
        _future = Future.value(payments);
      });
    } catch (_) {
      // Ignore transient polling failures; the next tick will retry.
    }
  }

  Future<void> _openDoctorSelection() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => DoctorSelectionScreen(apiClient: widget.apiClient),
      ),
    );

    if (result == true && mounted) {
      await _refresh();
    }
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
                onPressed: _openDoctorSelection,
                icon: const Icon(Icons.add),
                label: const Text("New"),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _refresh,
            child: FutureBuilder<List<Payment>>(
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

                final payments = snapshot.data!;
                if (payments.isEmpty) {
                  return ListView(
                    children: const [
                      Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                          child: Text(
                            'No payment requests yet. Tap "New" to create one.',
                          ),
                        ),
                      ),
                    ],
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: payments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final payment = payments[index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Text(
                            payment.doctorName.substring(0, 1).toUpperCase(),
                          ),
                        ),
                        title: Text(payment.doctorName),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Doctor ID: ${payment.doctorId}"),
                            Text("Product: ${payment.productName}"),
                            Text("Amount: ₹${payment.amount}"),
                          ],
                        ),
                        trailing: StatusChip(status: payment.status),
                        isThreeLine: true,
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
