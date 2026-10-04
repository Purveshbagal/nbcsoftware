import "package:file_picker/file_picker.dart";
import "package:flutter/material.dart";

import "../models/payment.dart";
import "../models/registration.dart";
import "../services/api_client.dart";

String _mimeTypeFor(String? extension) {
  switch (extension?.toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

class SurveyDoctorDetailScreen extends StatefulWidget {
  final ApiClient apiClient;
  final Registration doctor;
  final List<Payment> payments;

  const SurveyDoctorDetailScreen({
    super.key,
    required this.apiClient,
    required this.doctor,
    required this.payments,
  });

  @override
  State<SurveyDoctorDetailScreen> createState() =>
      _SurveyDoctorDetailScreenState();
}

class _SurveyDoctorDetailScreenState extends State<SurveyDoctorDetailScreen> {
  late List<Payment> _payments;
  final Set<String> _busy = {};

  @override
  void initState() {
    super.initState();
    _payments = widget.payments;
  }

  Future<void> _refreshPayment(String paymentId) async {
    final updated = await widget.apiClient.fetchPayment(paymentId);
    if (updated == null || !mounted) return;
    setState(() {
      _payments = _payments
          .map((p) => p.id == paymentId ? updated : p)
          .toList();
    });
  }

  Future<void> _download(Payment payment) async {
    setState(() => _busy.add(payment.id));
    try {
      final bytes = await widget.apiClient.downloadSurveyPdf(payment.id);
      final savedPath = await FilePicker.saveFile(
        dialogTitle: "Save survey form",
        fileName: "${payment.surveyFormNo ?? payment.id}-survey.pdf",
        type: FileType.custom,
        allowedExtensions: ["pdf"],
        bytes: bytes,
      );

      if (!mounted) return;
      if (savedPath == null) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Download cancelled")));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Survey form downloaded")),
        );
      }
      await _refreshPayment(payment.id);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Failed to download: $e")));
    } finally {
      if (mounted) setState(() => _busy.remove(payment.id));
    }
  }

  Future<void> _downloadReceipt(Payment payment) async {
    setState(() => _busy.add(payment.id));
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
      if (mounted) setState(() => _busy.remove(payment.id));
    }
  }

  Future<void> _upload(Payment payment) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final picked = result.files.first;
    final bytes = picked.bytes;
    if (bytes == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Could not read the selected file")),
      );
      return;
    }

    setState(() => _busy.add(payment.id));
    try {
      await widget.apiClient.uploadSurveyFile(
        payment.id,
        bytes: bytes,
        filename: picked.name,
        mimeType: _mimeTypeFor(picked.extension),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Survey form uploaded")));
      await _refreshPayment(payment.id);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Failed to upload: $e")));
    } finally {
      if (mounted) setState(() => _busy.remove(payment.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.doctor.doctorName)),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _payments.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final payment = _payments[index];
          final isBusy = _busy.contains(payment.id);

          return Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payment.productName,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "₹${payment.amount}",
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  if (payment.status != "approved")
                    const Text(
                      "Pending Approval",
                      style: TextStyle(color: Colors.orange),
                    )
                  else if (isBusy)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  else if (payment.surveyDownloadedAt == null)
                    FilledButton.icon(
                      onPressed: () => _download(payment),
                      icon: const Icon(Icons.download),
                      label: const Text("Download"),
                    )
                  else if (!payment.surveyUploaded)
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _download(payment),
                            icon: const Icon(Icons.download),
                            label: const Text("Re-download"),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: () => _upload(payment),
                            icon: const Icon(Icons.upload),
                            label: const Text("Upload"),
                          ),
                        ),
                      ],
                    )
                  else if (!payment.paymentGiven)
                    const Text(
                      "Pending",
                      style: TextStyle(color: Colors.orange),
                    )
                  else
                    FilledButton.icon(
                      onPressed: () => _downloadReceipt(payment),
                      icon: const Icon(Icons.download),
                      label: const Text("Download Receipt"),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
