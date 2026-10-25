import "dart:convert";
import "package:flutter/material.dart";
import "package:file_picker/file_picker.dart";

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
  final _mobileNumber = TextEditingController();
  final _email = TextEditingController();
  final _registrationNumber = TextEditingController();
  final _doctorAddress = TextEditingController();
  final _doctorPanNumber = TextEditingController();
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

  // Document upload
  List<Map<String, dynamic>> _documents = [];

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
    _email.dispose();
    _registrationNumber.dispose();
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

  Future<void> _pickDocument() async {
    // Document upload feature - to be implemented later
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Document upload feature coming soon')),
    );

    /*
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        final bytes = file.bytes;

        if (bytes != null) {
          final base64String = base64Encode(bytes);
          setState(() {
            _documents.add({
              'name': file.name,
              'data': base64String,
              'type': file.extension,
            });
          });
        }
      }
    } catch (e) {
      setState(() => _error = "Failed to pick document: $e");
    }
    */
  }

  void _removeDocument(int index) {
    setState(() {
      _documents.removeAt(index);
    });
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
        "doctorQualification": _selectedQualification,
        "speciality": _selectedSpeciality,
        "category": _selectedCategory,
        "gender": _selectedGender,
        "email": _email.text.trim(),
        "doctorAddress": _doctorAddress.text.trim(),
        "registrationNumber": _registrationNumber.text.trim(),
        "hospitalName": _hospitalName.text.trim(),
        "hospitalAddress": _hospitalAddress.text.trim(),
        "doctorPanNumber": _doctorPanNumber.text.trim(),
        "bankDetails": {
          "bankName": _bankName.text.trim(),
          "accountNumber": _bankAccountNumber.text.trim(),
          "ifscCode": _bankIfscCode.text.trim(),
          "branchName": _bankBranchName.text.trim(),
        },
        "documents": _documents.map((d) => d['data']).toList(),
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
        appBar: AppBar(title: const Text("New Registration")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("New Registration")),
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

              // Qualification Dropdown
              DropdownButtonFormField<String>(
                value: _selectedQualification,
                decoration: const InputDecoration(
                  labelText: "Qualification *",
                  border: OutlineInputBorder(),
                ),
                items: _qualifications.map((qual) {
                  return DropdownMenuItem(
                    value: qual,
                    child: Text(qual),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedQualification = value);
                },
              ),
              const SizedBox(height: 12),

              // Speciality Dropdown
              DropdownButtonFormField<String>(
                value: _selectedSpeciality,
                decoration: const InputDecoration(
                  labelText: "Speciality *",
                  border: OutlineInputBorder(),
                ),
                items: _specialities.map((spec) {
                  return DropdownMenuItem(
                    value: spec,
                    child: Text(spec),
                  );
                }).toList(),
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
                  return DropdownMenuItem(
                    value: cat,
                    child: Text(cat),
                  );
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
                  return DropdownMenuItem(
                    value: gender,
                    child: Text(gender),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedGender = value);
                },
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

              // Registration Number
              TextFormField(
                controller: _registrationNumber,
                decoration: const InputDecoration(
                  labelText: "Doctor Registration Number",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),

              // Doctor Address
              TextFormField(
                controller: _doctorAddress,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: "Doctor Address",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),

              // PAN Number
              TextFormField(
                controller: _doctorPanNumber,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: "Doctor PAN Number",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              // Bank Details Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        "Bank Details *",
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankName,
                        decoration: const InputDecoration(
                          labelText: "Bank Name",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? "Required" : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankAccountNumber,
                        decoration: const InputDecoration(
                          labelText: "Account Number",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? "Required" : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankIfscCode,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          labelText: "IFSC Code",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? "Required" : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankBranchName,
                        decoration: const InputDecoration(
                          labelText: "Branch Name",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? "Required" : null,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Document Upload Section
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        "Upload Doctor Documents",
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _pickDocument,
                        icon: const Icon(Icons.upload_file),
                        label: const Text("Upload Document (PDF/Image)"),
                      ),
                      if (_documents.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        ..._documents.asMap().entries.map((entry) {
                          final index = entry.key;
                          final doc = entry.value;
                          return ListTile(
                            leading: const Icon(Icons.insert_drive_file),
                            title: Text(doc['name']),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _removeDocument(index),
                            ),
                          );
                        }).toList(),
                      ],
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
