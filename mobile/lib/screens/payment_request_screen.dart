import "dart:async";

import "package:flutter/material.dart";

import "../models/payment.dart";
import "../models/product.dart";
import "../models/registration.dart";
import "../services/api_client.dart";
import "../widgets/status_chip.dart";
import "payment_detail_screen.dart";

const _pollInterval = Duration(seconds: 10);

class PaymentRequestScreen extends StatefulWidget {
  final ApiClient apiClient;

  const PaymentRequestScreen({super.key, required this.apiClient});

  @override
  State<PaymentRequestScreen> createState() => _PaymentRequestScreenState();
}

class _PaymentRequestScreenState extends State<PaymentRequestScreen> {
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

  Future<void> _openNewPaymentSheet() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _NewPaymentSheet(apiClient: widget.apiClient),
    );

    if (created == true) {
      await _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openNewPaymentSheet,
        icon: const Icon(Icons.add),
        label: const Text("New"),
      ),
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
                        'No payment requests yet. Tap "New" to submit one.',
                      ),
                    ),
                  ),
                ],
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
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
      ),
    );
  }
}

class _NewPaymentSheet extends StatefulWidget {
  final ApiClient apiClient;

  const _NewPaymentSheet({required this.apiClient});

  @override
  State<_NewPaymentSheet> createState() => _NewPaymentSheetState();
}

class _NewPaymentSheetState extends State<_NewPaymentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _purpose = TextEditingController();
  String? _doctorId;
  String? _productId;
  bool _submitting = false;
  String? _error;

  late Future<(List<Registration>, List<Product>)> _optionsFuture;

  @override
  void initState() {
    super.initState();
    _optionsFuture = _loadOptions();
  }

  Future<(List<Registration>, List<Product>)> _loadOptions() async {
    final doctors = await widget.apiClient.fetchApprovedRegistrations();
    final products = await widget.apiClient.fetchProducts();
    return (doctors, products);
  }

  @override
  void dispose() {
    _amount.dispose();
    _purpose.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_doctorId == null || _productId == null) {
      setState(() => _error = "Please select a doctor and a product");
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await widget.apiClient.createPayment({
        "amount": _amount.text.trim(),
        "doctorId": _doctorId,
        "productId": _productId,
        "purpose": _purpose.text.trim(),
      });

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: FutureBuilder<(List<Registration>, List<Product>)>(
          future: _optionsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Text("Failed to load: ${snapshot.error}"),
              );
            }

            final (doctors, products) = snapshot.data!;

            return Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "New Payment Request",
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _doctorId,
                    decoration: const InputDecoration(
                      labelText: "Doctor",
                      border: OutlineInputBorder(),
                    ),
                    items: doctors
                        .map(
                          (d) => DropdownMenuItem(
                            value: d.doctorId,
                            child: Text(
                              "${d.doctorName} (${d.doctorId})",
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _doctorId = value),
                    validator: (value) =>
                        value == null ? "Select a doctor" : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _productId,
                    decoration: const InputDecoration(
                      labelText: "Product",
                      border: OutlineInputBorder(),
                    ),
                    items: products
                        .map(
                          (p) => DropdownMenuItem(
                            value: p.id,
                            child: Text(
                              p.name,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _productId = value),
                    validator: (value) =>
                        value == null ? "Select a product" : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _amount,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: "Amount (₹)",
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      final amount = num.tryParse(v?.trim() ?? "");
                      if (amount == null || amount <= 0) {
                        return "Enter a valid amount";
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _purpose,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: "Purpose / Notes (optional)",
                      border: OutlineInputBorder(),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  ],
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text("Submit"),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
