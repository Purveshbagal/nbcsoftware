import "dart:async";

import "package:flutter/material.dart";

import "../models/payment.dart";
import "../services/api_client.dart";
import "../widgets/status_chip.dart";
import "payment_detail_screen.dart";

const _pollInterval = Duration(seconds: 10);

class PaymentStatusScreen extends StatefulWidget {
  final ApiClient apiClient;

  const PaymentStatusScreen({super.key, required this.apiClient});

  @override
  State<PaymentStatusScreen> createState() => _PaymentStatusScreenState();
}

class _PaymentStatusScreenState extends State<PaymentStatusScreen> {
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

  // Runs on a timer so an admin's approve/reject decision shows up here
  // without the user having to pull-to-refresh.
  Future<void> _silentRefresh() async {
    try {
      final payments = await widget.apiClient.fetchPayments();
      if (!mounted) return;
      setState(() => _future = Future.value(payments));
    } catch (_) {
      // Ignore transient polling failures; the next tick will retry.
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
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
                  child: Center(child: Text("No payment requests yet.")),
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
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PaymentDetailScreen(
                        apiClient: widget.apiClient,
                        payment: payment,
                      ),
                    ),
                  ),
                  isThreeLine: true,
                  title: Text("₹${payment.amount}"),
                  subtitle: Text(
                    "${payment.doctorName.isNotEmpty ? "${payment.doctorName} · ${payment.productName}" : payment.productName}\n"
                    "${stageLabel(payment)}",
                  ),
                  trailing: StatusChip(status: payment.status),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
