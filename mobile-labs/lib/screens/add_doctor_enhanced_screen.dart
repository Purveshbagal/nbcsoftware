import "dart:convert";
import "package:flutter/material.dart";
import "package:file_picker/file_picker.dart";
import "package:geolocator/geolocator.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";
import "location_picker_enhanced_screen.dart";

/// Enhanced Add Doctor screen with all new fields:
/// - Hospital Address
/// - Email
/// - Bank Details (4 fields)
/// - Document Upload (PDF/Images)
/// - Location Picker (with map)
/// - UIN ID auto-generation on backend
/// - Pending approval status
class AddDoctorEnhancedScreen extends StatefulWidget {
  const AddDoctorEnhancedScreen({super.key});

  @override
  State<AddDoctorEnhancedScreen> createState() => _AddDoctorEnhancedScreenState();
}

class _AddDoctorEnhancedScreenState extends State<AddDoctorEnhancedScreen> {
  final _formKey = GlobalKey<FormState>();
  final _values = <String, dynamic>{};
  final _bankDetails = <String, String>{};
  final _documents = <Map<String, dynamic>>[];

  Map<String, List<String>> _masters = {};
  Position? _selectedLocation;
  bool _saving = false;
  bool _loadingLocation = false;

  @override
  void initState() {
    super.initState();
    _loadMasters();
  }

  Future<void> _loadMasters() async {
    try {
      // The Labs endpoints return a list of names. Older deployments returned
      // `{ name: ... }` rows, so accept both formats while apps are upgraded.
      final qualResp = await ApiClient.instance.get("/doctor-qualifications");
      final specResp = await ApiClient.instance.get("/doctor-specialities");

      final quals = _names(qualResp["qualifications"]);
      final specs = _names(specResp["specialities"]);

      if (!mounted) return;
      setState(() {
        _masters = {
          "qualification": quals,
          "doctor-speciality": specs,
          "doctor-category": const ["Important", "Super Important", "A"],
        };
      });
    } catch (e) {
      // Fallback to old masters API
      final m = await ApiClient.instance.masters(["doctor-speciality", "qualification", "doctor-category"]);
      if (mounted) setState(() => _masters = m);
    }
  }

  List<String> _names(Object? response) => (response as List? ?? const [])
      .map((item) => item is Map ? item["name"] : item)
      .whereType<String>()
      .map((name) => name.trim())
      .where((name) => name.isNotEmpty)
      .toList();

  Widget _text(String key, String label, {bool required = false, TextInputType? keyboard, int lines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        decoration: InputDecoration(labelText: required ? "$label *" : label),
        keyboardType: keyboard,
        maxLines: lines,
        textCapitalization: keyboard == null ? TextCapitalization.words : TextCapitalization.none,
        onChanged: (v) => _values[key] = v.trim(),
        validator: required ? (v) => (v ?? "").trim().isEmpty ? "$label is required" : null : null,
      ),
    );
  }

  Widget _bankText(String key, String label, {bool required = false, TextInputType? keyboard}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        decoration: InputDecoration(labelText: required ? "$label *" : label),
        keyboardType: keyboard,
        textCapitalization: key == "ifscCode" ? TextCapitalization.characters : TextCapitalization.words,
        onChanged: (v) => _bankDetails[key] = v.trim(),
        validator: required ? (v) => (v ?? "").trim().isEmpty ? "$label is required" : null : null,
      ),
    );
  }

  Widget _pick(String key, String label, String master, {List<String> fallback = const []}) {
    final options = _masters[master]?.isNotEmpty == true ? _masters[master]! : fallback;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: PickerField(
        label: label,
        value: _values[key],
        options: options,
        onChanged: (v) => setState(() => _values[key] = v),
      ),
    );
  }

  Future<void> _pickLocation() async {
    setState(() => _loadingLocation = true);
    final result = await Navigator.of(context).push<Position>(
      MaterialPageRoute(
        builder: (_) => LocationPickerEnhancedScreen(initialLocation: _selectedLocation),
      ),
    );
    if (!mounted) return;
    if (result != null) {
      setState(() => _selectedLocation = result);
    }
    setState(() => _loadingLocation = false);
  }

  Future<void> _pickDocument() async {
    try {
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (files != null && files.isNotEmpty) {
        final file = files.first;
        final bytes = await file.readAsBytes();

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
      if (mounted) showError(context, "Failed to pick document: $e");
    }
  }

  void _removeDocument(int index) {
    setState(() => _documents.removeAt(index));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    // Validate required dropdowns
    if (_values["qualification"] == null || (_values["qualification"] as String).isEmpty) {
      showError(context, "Please select a qualification");
      return;
    }
    if (_values["speciality"] == null || (_values["speciality"] as String).isEmpty) {
      showError(context, "Please select a speciality");
      return;
    }

    setState(() => _saving = true);
    try {
      final payload = {
        ..._values,
        "source": "racer", // Mark as coming from Racer app
        "bankDetails": _bankDetails,
        "documents": _documents.map((d) => d['data']).toList(),
      };

      // Add location if selected
      if (_selectedLocation != null) {
        payload["location"] = {
          "latitude": _selectedLocation!.latitude,
          "longitude": _selectedLocation!.longitude,
        };
      }

      final data = await ApiClient.instance.post("/doctors", payload);

      if (!mounted) return;

      final uinId = data["item"]["uinId"] ?? "N/A";
      showMessage(context, "Doctor added successfully! UIN: $uinId\nPending admin approval.");
      Navigator.of(context).pop(data["item"] as Json);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Add Doctor")),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Info banner
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppTheme.indigo.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.indigo.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: AppTheme.indigo, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "Doctor will be pending approval. UIN ID will be auto-generated.",
                      style: TextStyle(fontSize: 12, color: AppTheme.navy),
                    ),
                  ),
                ],
              ),
            ),

            // Basic Info
            _text("name", "Doctor Name", required: true),
            _text("contactNo", "Mobile Number", required: true, keyboard: TextInputType.phone),
            _pick("qualification", "Qualification", "qualification"),
            _pick("speciality", "Speciality", "doctor-speciality"),
            _pick("category", "Category", "doctor-category", fallback: const ["Important", "Super Important", "A"]),
            _pick("gender", "Gender", "", fallback: const ["Male", "Female", "Other"]),

            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 8),

            // Hospital Info
            Text("Hospital Information", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            _text("hospitalName", "Hospital Name", required: true),
            _text("hospitalAddress", "Hospital Address", lines: 2),
            _text("email", "Email", keyboard: TextInputType.emailAddress),

            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 8),

            // Bank Details
            Text("Bank Details", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            _bankText("bankName", "Bank Name (Optional)", required: false),
            _bankText("accountNumber", "Account Number (Optional)", required: false, keyboard: TextInputType.number),
            _bankText("ifscCode", "IFSC Code (Optional)", required: false),
            _bankText("branchName", "Branch Name (Optional)", required: false),

            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 8),

            // Location
            Text("Location", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),

            if (_selectedLocation != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Lat: ${_selectedLocation!.latitude.toStringAsFixed(6)}\nLng: ${_selectedLocation!.longitude.toStringAsFixed(6)}",
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() => _selectedLocation = null),
                    ),
                  ],
                ),
              ),

            OutlinedButton.icon(
              onPressed: _loadingLocation ? null : _pickLocation,
              icon: _loadingLocation
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.location_on_outlined),
              label: const Text("Pick up location"),
            ),

            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 8),

            // Documents
            Text("Documents", style: Theme.of(context).textTheme.titleMedium),
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
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.insert_drive_file, color: AppTheme.indigo),
                    title: Text(doc['name'], style: const TextStyle(fontSize: 14)),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () => _removeDocument(index),
                    ),
                  ),
                );
              }).toList(),
            ],

            const SizedBox(height: 24),
            BusyButton(label: "Save Doctor", busy: _saving, onPressed: _save),
            const SizedBox(height: 8),
            Text(
              "Note: Doctor will be sent for admin approval",
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
