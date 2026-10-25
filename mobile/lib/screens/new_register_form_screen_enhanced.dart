import "package:flutter/material.dart";

import "../services/api_client.dart";
import "../widgets/searchable_dropdown.dart";

class NewRegisterFormScreen extends StatefulWidget {
  final ApiClient apiClient;

  const NewRegisterFormScreen({super.key, required this.apiClient});

  @override
  State<NewRegisterFormScreen> createState() => _NewRegisterFormScreenState();
}

class _NewRegisterFormScreenState extends State<NewRegisterFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _doctorName = TextEditingController();
  final _mobileNumber = TextEditingController();
  final _registrationNumber = TextEditingController();
  final _email = TextEditingController();
  final _hospitalName = TextEditingController();
  final _hospitalAddress = TextEditingController();
  final _bankName = TextEditingController();
  final _bankAccountNumber = TextEditingController();
  final _bankIfscCode = TextEditingController();
  final _bankBranchName = TextEditingController();

  // Dropdowns
  String? _selectedQualification;
  String? _selectedSpeciality;
  String? _selectedCategory;
  String? _selectedGender;

  // Lists for dropdowns
  List<String> _qualifications = [];
  List<String> _specialities = [];
  final List<String> _categories = ["Important", "Super Important", "A"];
  final List<String> _genders = ["Male", "Female", "Other"];

  bool _submitting = false;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMasterData();
  }

  @override
  void dispose() {
    _doctorName.dispose();
    _mobileNumber.dispose();
    _registrationNumber.dispose();
    _email.dispose();
    _hospitalName.dispose();
    _hospitalAddress.dispose();
    _bankName.dispose();
    _bankAccountNumber.dispose();
    _bankIfscCode.dispose();
    _bankBranchName.dispose();
    super.dispose();
  }

  Future<void> _loadMasterData() async {
    try {
      // Fetch qualifications and specialities from new endpoints
      final quals = await widget.apiClient.fetchQualifications();
      final specs = await widget.apiClient.fetchSpecialities();

      setState(() {
        _qualifications = quals.map((q) => q["name"] as String).toList();
        _specialities = specs.map((s) => s["name"] as String).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = "Failed to load master data: $e";
        _loading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedQualification == null) {
      setState(() => _error = "Please select a qualification");
      return;
    }

    if (_selectedSpeciality == null) {
      setState(() => _error = "Please select a speciality");
      return;
    }

    if (_selectedCategory == null) {
      setState(() => _error = "Please select a category");
      return;
    }

    if (_selectedGender == null) {
      setState(() => _error = "Please select gender");
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final registration = await widget.apiClient.createRegistration({
        "doctorName": _doctorName.text.trim(),
        "mobileNumber": _mobileNumber.text.trim(),
        "registrationNumber": _registrationNumber.text.trim(),
        "doctorQualification": _selectedQualification,
        "speciality": _selectedSpeciality,
        "category": _selectedCategory,
        "gender": _selectedGender,
        "email": _email.text.trim(),
        "hospitalName": _hospitalName.text.trim(),
        "hospitalAddress": _hospitalAddress.text.trim(),
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
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text("Add Doctor")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Add Doctor")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Doctor Name
              TextFormField(
                controller: _doctorName,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: "Doctor Name *",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 12),

              // Mobile Number
              TextFormField(
                controller: _mobileNumber,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: "Mobile Number *",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _registrationNumber,
                decoration: const InputDecoration(
                  labelText: "Doctor Registration Number *",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 12),

              // Qualification Searchable Dropdown
              SearchableDropdown(
                label: "Qualification *",
                items: _qualifications,
                value: _selectedQualification,
                onChanged: (value) {
                  setState(() => _selectedQualification = value);
                },
              ),
              const SizedBox(height: 12),

              // Speciality Searchable Dropdown
              SearchableDropdown(
                label: "Speciality *",
                items: _specialities,
                value: _selectedSpeciality,
                onChanged: (value) {
                  setState(() => _selectedSpeciality = value);
                },
              ),
              const SizedBox(height: 12),

              // Category Dropdown
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: "Category *",
                  border: OutlineInputBorder(),
                ),
                items: _categories.map((cat) {
                  return DropdownMenuItem(value: cat, child: Text(cat));
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedCategory = value);
                },
              ),
              const SizedBox(height: 12),

              // Gender
              DropdownButtonFormField<String>(
                value: _selectedGender,
                decoration: const InputDecoration(
                  labelText: "Gender *",
                  border: OutlineInputBorder(),
                ),
                items: _genders.map((gender) {
                  return DropdownMenuItem(value: gender, child: Text(gender));
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedGender = value);
                },
              ),
              const SizedBox(height: 12),

              Text(
                "Hospital Information",
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 12),

              // Email
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: "Email",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),

              // Hospital Name
              TextFormField(
                controller: _hospitalName,
                decoration: const InputDecoration(
                  labelText: "Hospital Name *",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 12),

              // Hospital Address
              TextFormField(
                controller: _hospitalAddress,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: "Hospital Address",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),

              // Bank Details Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        "Bank Details (Optional)",
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
              const SizedBox(height: 16),

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
