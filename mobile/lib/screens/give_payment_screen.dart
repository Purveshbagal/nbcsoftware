import "dart:async";

import "package:file_picker/file_picker.dart";
import "package:flutter/material.dart";

import "../models/payment.dart";
import "../services/api_client.dart";

const _pollInterval = Duration(seconds: 10);

String _formatDate(DateTime? value) {
  if (value == null) return "-";
  final local = value.toLocal();
  String two(int n) => n.toString().padLeft(2, "0");
  return "${two(local.day)}/${two(local.month)}/${local.year}";
}

/// Lists payments the admin has disbursed (receipt generated) and lets the
/// rep record handing the cash to the doctor. Receipt generation itself
/// happens only on the admin's desktop.
class GivePaymentScreen extends StatefulWidget {
  final ApiClient apiClient;

  const GivePaymentScreen({super.key, required this.apiClient});

  @override
  State<GivePaymentScreen> createState() => _GivePaymentScreenState();
}

class _GivePaymentScreenState extends State<GivePaymentScreen> {
  List<Payment> _disbursed = [];
  bool _loading = true;
  final Set<String> _downloading = {};
  String? _error;
  Timer? _pollTimer;

  List<Payment> get _readyToGive =>
      _disbursed.where((p) => p.readyToHandOver).toList();

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final payments = await widget.apiClient.fetchPayments();
      if (!mounted) return;
      setState(() {
        _disbursed = payments.where((p) => p.paymentGiven).toList();
        _error = null;
      });
    } catch (e) {
      if (!silent && mounted) setState(() => _error = e.toString());
    } finally {
      if (!silent && mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openGiveSheet() async {
    final given = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) =>
          _GiveSheet(apiClient: widget.apiClient, payments: _readyToGive),
    );

    if (given == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Payment recorded as given to doctor")),
      );
      await _load();
    }
  }

  Future<void> _downloadReceipt(Payment payment) async {
    setState(() => _downloading.add(payment.id));
    try {
      final bytes = await widget.apiClient.downloadReceiptPdf(payment.id);
      final savedPath = await FilePicker.saveFile(
        dialogTitle: "Save receipt",
        fileName: "receipt-${payment.receiptNumber ?? payment.id}.pdf",
        type: FileType.custom,
        allowedExtensions: ["pdf"],
        bytes: bytes,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            savedPath == null ? "Download cancelled" : "Receipt downloaded",
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Failed to download: $e")));
    } finally {
      if (mounted) setState(() => _downloading.remove(payment.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: () => _load(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Give Payment", style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      "Record the payment once you have handed the cash "
                      "to the doctor.",
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                onPressed: _openGiveSheet,
                icon: const Icon(Icons.currency_rupee),
                label: const Text("Give"),
              ),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          if (_disbursed.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  "No payments yet. Doctors appear here once the admin "
                  "gives the payment and generates the receipt.",
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else
            ..._disbursed.map((payment) {
              final isDownloading = _downloading.contains(payment.id);
              final givenLabel = payment.handedOverToDoctor
                  ? "Given to doctor on ${_formatDate(payment.handedOverAt)}"
                  : "Pending — give to doctor";
              return Card(
                child: ListTile(
                  isThreeLine: true,
                  title: Text(payment.doctorName),
                  subtitle: Text(
                    "Receipt ${payment.receiptNumber ?? "-"} · "
                    "₹${payment.netAmount ?? payment.amount} net\n"
                    "$givenLabel",
                  ),
                  trailing: isDownloading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon: const Icon(Icons.download),
                          tooltip: "Download receipt",
                          onPressed: () => _downloadReceipt(payment),
                        ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _GiveSheet extends StatefulWidget {
  final ApiClient apiClient;
  final List<Payment> payments;

  const _GiveSheet({required this.apiClient, required this.payments});

  @override
  State<_GiveSheet> createState() => _GiveSheetState();
}

class _GiveSheetState extends State<_GiveSheet> {
  String? _selectedId;
  bool _submitting = false;
  String? _error;

  Payment? get _selected {
    for (final p in widget.payments) {
      if (p.id == _selectedId) return p;
    }
    return null;
  }

  Future<void> _give() async {
    final id = _selectedId;
    if (id == null) return;

    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await widget.apiClient.handOverPayment(id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selected;
    final payments = widget.payments;

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Give Payment", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              "Only doctors whose receipt the admin has generated are listed.",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedId,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: "Doctor",
                border: OutlineInputBorder(),
              ),
              items: payments
                  .map(
                    (p) => DropdownMenuItem(
                      value: p.id,
                      child: Text(
                        "${p.doctorName} — ${p.productName}",
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              hint: payments.isEmpty
                  ? const Text(
                      "No payments ready to give",
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    )
                  : null,
              onChanged: payments.isEmpty || _submitting
                  ? null
                  : (value) => setState(() => _selectedId = value),
            ),
            const SizedBox(height: 12),
            _ReadOnlyField(
              label: "Receipt No.",
              value: selected?.receiptNumber ?? "-",
            ),
            const SizedBox(height: 12),
            _ReadOnlyField(
              label: "Amount (₹)",
              value: selected == null ? "-" : "${selected.amount}",
            ),
            const SizedBox(height: 12),
            _ReadOnlyField(
              label: "TDS Deduction (₹)",
              value: selected == null ? "-" : "${selected.tdsAmount ?? 0}",
            ),
            const SizedBox(height: 12),
            _ReadOnlyField(
              label: "Net Amount to Give (₹)",
              value: selected == null
                  ? "-"
                  : "${selected.netAmount ?? selected.amount}",
            ),
            const SizedBox(height: 12),
            _ReadOnlyField(label: "Date", value: _formatDate(DateTime.now())),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: (selected == null || _submitting) ? null : _give,
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text("Give"),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReadOnlyField extends StatelessWidget {
  final String label;
  final String value;

  const _ReadOnlyField({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      child: Text(value),
    );
  }
}
