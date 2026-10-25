import "package:flutter/material.dart";

import "../app_theme.dart";
import "../models/payment.dart";
import "../services/api_client.dart";

enum LedgerKind { pending, paid }

String formatRupees(num value) {
  final digits = value.round().abs().toString();
  // Indian grouping: last three digits, then pairs (12,34,567).
  final buffer = StringBuffer();
  final head = digits.length > 3 ? digits.substring(0, digits.length - 3) : "";
  final tail = digits.length > 3 ? digits.substring(digits.length - 3) : digits;
  for (var i = 0; i < head.length; i++) {
    if (i > 0 && (head.length - i) % 2 == 0) buffer.write(",");
    buffer.write(head[i]);
  }
  if (head.isNotEmpty) buffer.write(",");
  buffer.write(tail);
  return "${value < 0 ? "-" : ""}₹$buffer";
}

String _formatDate(DateTime? value) {
  if (value == null) return "-";
  final local = value.toLocal();
  String two(int n) => n.toString().padLeft(2, "0");
  return "${two(local.day)}/${two(local.month)}/${local.year}";
}

/// The signed-in rep's own payments: either still owed to doctors or already
/// handed over. The API only returns the rep's own payments.
class PaymentLedgerScreen extends StatefulWidget {
  final ApiClient apiClient;
  final LedgerKind kind;

  const PaymentLedgerScreen({
    super.key,
    required this.apiClient,
    required this.kind,
  });

  @override
  State<PaymentLedgerScreen> createState() => _PaymentLedgerScreenState();
}

class _PaymentLedgerScreenState extends State<PaymentLedgerScreen> {
  late Future<List<Payment>> _future = _load();

  bool get _pending => widget.kind == LedgerKind.pending;

  Future<List<Payment>> _load() async {
    final payments = await widget.apiClient.fetchPayments();
    final rows = payments
        .where((p) => _pending ? p.owedToDoctor : p.handedOverToDoctor)
        .toList();
    if (!_pending) {
      rows.sort((a, b) => b.handedOverAt!.compareTo(a.handedOverAt!));
    }
    return rows;
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    try {
      await next;
    } catch (_) {
      // The FutureBuilder renders the failure.
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _pending ? "Pending Payments" : "Total Spend";
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Payment>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: [
                  const SizedBox(height: 40),
                  const Icon(Icons.cloud_off_outlined, size: 32),
                  const SizedBox(height: 12),
                  Text("${snapshot.error}", textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  Center(
                    child: OutlinedButton.icon(
                      onPressed: _refresh,
                      icon: const Icon(Icons.refresh),
                      label: const Text("Try again"),
                    ),
                  ),
                ],
              );
            }

            final rows = snapshot.data!;
            final total = rows.fold<num>(0, (sum, p) => sum + p.payableAmount);
            final doctors = rows.map((p) => p.doctorId).toSet().length;

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                _TotalCard(
                  label: _pending ? "Still to give" : "Given to doctors",
                  total: total,
                  detail:
                      "${rows.length} ${rows.length == 1 ? "payment" : "payments"}"
                      " · $doctors ${doctors == 1 ? "doctor" : "doctors"}",
                  pending: _pending,
                ),
                const SizedBox(height: 16),
                if (rows.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Text(
                      _pending
                          ? "No pending payments. Approved payments appear here until you give them to the doctor."
                          : "No payments given yet. Payments you give to doctors appear here.",
                      textAlign: TextAlign.center,
                    ),
                  )
                else
                  ...rows.map(
                    (p) => _LedgerTile(payment: p, pending: _pending),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _TotalCard extends StatelessWidget {
  final String label;
  final num total;
  final String detail;
  final bool pending;

  const _TotalCard({
    required this.label,
    required this.total,
    required this.detail,
    required this.pending,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppTheme.mint,
              fontSize: 10,
              letterSpacing: 1.4,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            formatRupees(total),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            detail,
            style: const TextStyle(color: Color(0xFFCBDDE7), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _LedgerTile extends StatelessWidget {
  final Payment payment;
  final bool pending;

  const _LedgerTile({required this.payment, required this.pending});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final stageColor = payment.paymentGiven
        ? AppTheme.teal
        : const Color(0xFF97600C);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(payment.doctorName, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 3),
                  Text(payment.productName, style: theme.textTheme.bodySmall),
                  const SizedBox(height: 8),
                  if (pending)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: stageColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        payment.ledgerStage,
                        style: TextStyle(
                          color: stageColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    )
                  else
                    Text(
                      "Given on ${_formatDate(payment.handedOverAt)}"
                      " · Receipt ${payment.receiptNumber ?? "-"}",
                      style: theme.textTheme.bodySmall,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              formatRupees(payment.payableAmount),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
