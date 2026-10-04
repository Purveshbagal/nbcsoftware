import "dart:async";

import "package:file_picker/file_picker.dart";
import "package:flutter/material.dart";

import "../models/payment.dart";
import "../services/api_client.dart";
import "../widgets/status_chip.dart";

const _pollInterval = Duration(seconds: 10);

String stageLabel(Payment payment) {
  if (payment.status == "pending") return "Request submitted — awaiting approval";
  if (payment.status == "rejected") return "Request rejected";
  if (!payment.surveyUploaded) return "Approved — survey form pending";
  if (!payment.paymentGiven) return "Survey received — payment pending";
  if (!payment.handedOverToDoctor) return "Receipt ready — give to doctor";
  return "Payment given to doctor";
}

class PaymentDetailScreen extends StatefulWidget {
  final ApiClient apiClient;
  final Payment payment;

  const PaymentDetailScreen({
    super.key,
    required this.apiClient,
    required this.payment,
  });

  @override
  State<PaymentDetailScreen> createState() => _PaymentDetailScreenState();
}

class _PaymentDetailScreenState extends State<PaymentDetailScreen> {
  late Payment _payment;
  Timer? _pollTimer;
  bool _downloading = false;

  @override
  void initState() {
    super.initState();
    _payment = widget.payment;
    _pollTimer = Timer.periodic(_pollInterval, (_) => _silentRefresh());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  // Runs on a timer so an admin's approve/reject decision (and survey
  // download/upload state) shows up here without needing to go back and
  // reopen this page.
  Future<void> _silentRefresh() async {
    try {
      final updated = await widget.apiClient.fetchPayment(_payment.id);
      if (!mounted || updated == null) return;
      setState(() => _payment = updated);
    } catch (_) {
      // Ignore transient polling failures; the next tick will retry.
    }
  }

  Future<void> _downloadReceipt() async {
    setState(() => _downloading = true);
    try {
      final bytes = await widget.apiClient.downloadReceiptPdf(_payment.id);
      final savedPath = await FilePicker.saveFile(
        dialogTitle: "Save receipt",
        fileName: "receipt-${_payment.receiptNumber ?? _payment.id}.pdf",
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
      if (mounted) setState(() => _downloading = false);
    }
  }

  String _formatDate(DateTime? value) {
    if (value == null) return "-";
    final local = value.toLocal();
    String two(int n) => n.toString().padLeft(2, "0");
    return "${two(local.day)}/${two(local.month)}/${local.year} ${two(local.hour)}:${two(local.minute)}";
  }

  @override
  Widget build(BuildContext context) {
    final payment = _payment;
    return Scaffold(
      appBar: AppBar(title: const Text("Payment Request Details")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "₹${payment.amount}",
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              StatusChip(status: payment.status),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            stageLabel(payment),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.outline,
            ),
          ),
          const SizedBox(height: 16),
          _DetailRow(label: "Doctor", value: payment.doctorName),
          _DetailRow(label: "Doctor ID", value: payment.doctorId),
          _DetailRow(label: "Product", value: payment.productName),
          if (payment.productComposition?.isNotEmpty == true)
            _DetailRow(
              label: "Composition",
              value: payment.productComposition!,
            ),
          _DetailRow(label: "Purpose / Notes", value: payment.purpose ?? "-"),
          _DetailRow(
            label: "Submitted",
            value: _formatDate(payment.createdAt),
          ),
          if (payment.status == "approved") ...[
            const Divider(height: 32),
            Text(
              "Survey Paper",
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            _DetailRow(
              label: "Form No.",
              value: payment.surveyFormNo ?? "Not yet downloaded",
            ),
            _DetailRow(
              label: "Downloaded",
              value: _formatDate(payment.surveyDownloadedAt),
            ),
            _DetailRow(
              label: "Uploaded",
              value: payment.surveyUploaded
                  ? _formatDate(payment.surveyUploadedAt)
                  : "Not uploaded yet",
            ),
            const SizedBox(height: 8),
            Text(
              "Manage the download/upload from the Survey Paper section.",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.outline,
              ),
            ),
            if (payment.paymentGiven) ...[
              const SizedBox(height: 16),
              Text(
                "Payment",
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              _DetailRow(
                label: "Receipt No.",
                value: payment.receiptNumber ?? "-",
              ),
              _DetailRow(
                label: "Net Amount",
                value: "₹${payment.netAmount ?? payment.amount}",
              ),
              _DetailRow(label: "Paid On", value: _formatDate(payment.paidAt)),
              _DetailRow(
                label: "Given to Doctor",
                value: payment.handedOverToDoctor
                    ? _formatDate(payment.handedOverAt)
                    : "Pending",
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _downloading ? null : _downloadReceipt,
                icon: _downloading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.download),
                label: const Text("Download Receipt"),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(color: Theme.of(context).colorScheme.outline),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
