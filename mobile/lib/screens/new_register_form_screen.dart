import "package:flutter/material.dart";

import "../services/api_client.dart";

class NewRegisterFormScreen extends StatefulWidget {
  final ApiClient apiClient;

  const NewRegisterFormScreen({super.key, required this.apiClient});

  @override
  State<NewRegisterFormScreen> createState() => _NewRegisterFormScreenState();
}

class _NewRegisterFormScreenState extends State<NewRegisterFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _doctorName = TextEditingController();
  final _doctorQualification = TextEditingController();
  final _registrationNumber = TextEditingController();
  final _mobileNumber = TextEditingController();
  final _doctorAddress = TextEditingController();
  final _doctorPanNumber = TextEditingController();
  final _hospitalName = TextEditingController();
  final _hospitalAddress = TextEditingController();
  final _bankName = TextEditingController();
  final _bankAccountNumber = TextEditingController();
  final _bankIfscCode = TextEditingController();
  final _bankBranchName = TextEditingController();

  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _doctorName.dispose();
    _doctorQualification.dispose();
    _registrationNumber.dispose();
    _mobileNumber.dispose();
    _doctorAddress.dispose();
    _doctorPanNumber.dispose();
    _hospitalName.dispose();
    _hospitalAddress.dispose();
    _bankName.dispose();
    _bankAccountNumber.dispose();
    _bankIfscCode.dispose();
    _bankBranchName.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final registration = await widget.apiClient.createRegistration({
        "doctorName": _doctorName.text.trim(),
        "doctorAddress": _doctorAddress.text.trim(),
        "doctorQualification": _doctorQualification.text.trim(),
        "registrationNumber": _registrationNumber.text.trim(),
        "mobileNumber": _mobileNumber.text.trim(),
        "hospitalName": _hospitalName.text.trim(),
        "hospitalAddress": _hospitalAddress.text.trim(),
        "doctorPanNumber": _doctorPanNumber.text.trim(),
        "bankDetails": {
          "bankName": _bankName.text.trim(),
          "accountNumber": _bankAccountNumber.text.trim(),
          "ifscCode": _bankIfscCode.text.trim(),
          "branchName": _bankBranchName.text.trim(),
        },
      });

      if (!mounted) return;
      Navigator.of(context).pop(registration);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("New Registration")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _doctorName,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: "Doctor Name",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _doctorQualification,
                decoration: const InputDecoration(
                  labelText: "Doctor Qualification (optional)",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _registrationNumber,
                decoration: const InputDecoration(
                  labelText: "Doctor Registration Number",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _mobileNumber,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: "Mobile Number (optional)",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _doctorAddress,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: "Doctor Address (optional)",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _doctorPanNumber,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: "Doctor PAN Number (optional)",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _hospitalName,
                decoration: const InputDecoration(
                  labelText: "Hospital Name (optional)",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _hospitalAddress,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: "Hospital Address (optional)",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        "Doctor Bank Details (optional)",
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankName,
                        decoration: const InputDecoration(
                          labelText: "Bank Name",
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankAccountNumber,
                        decoration: const InputDecoration(
                          labelText: "Account Number",
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankIfscCode,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          labelText: "IFSC Code",
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankBranchName,
                        decoration: const InputDecoration(
                          labelText: "Branch Name",
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ],
                  ),
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
                    : const Text("Save"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
