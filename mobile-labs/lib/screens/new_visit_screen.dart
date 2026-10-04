import "package:flutter/material.dart";
import "package:geolocator/geolocator.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../services/location_tracker.dart";
import "../services/permissions.dart";
import "../widgets/common.dart";
import "directory_screen.dart";

/// Log a call on a doctor, or on a firm (chemist, hospital, stockist). The
/// screen opening is the check-in; saving is the check-out, stamped with GPS.
class NewVisitScreen extends StatefulWidget {
  const NewVisitScreen({super.key});

  @override
  State<NewVisitScreen> createState() => _NewVisitScreenState();
}

class _NewVisitScreenState extends State<NewVisitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _checkInAt = DateTime.now();

  String _type = "doctor";
  Json? _subject;
  bool _skipped = false;
  String _skippedReason = "";
  String _callObjective = "";
  String _postCallInfo = "";
  List<String> _products = [];
  List<String> _samples = [];
  List<String> _gifts = [];
  final _pob = TextEditingController();
  final _remarks = TextEditingController();

  Map<String, List<String>> _masters = {};
  List<String> _productNames = [];

  Position? _position;
  String? _gpsError;
  bool _locating = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _locate();
    _loadOptions();
  }

  @override
  void dispose() {
    _pob.dispose();
    _remarks.dispose();
    super.dispose();
  }

  Future<void> _loadOptions() async {
    final masters = await ApiClient.instance.masters([
      "call-objective",
      "post-call-info",
      "product-sample",
      "promotional-gift",
      "skipped-reason",
    ]);
    List<String> products = [];
    try {
      products = (await ApiClient.instance.list("/products")).map((p) => str(p["name"])).toList();
    } on ApiException {
      // Products are optional on a visit.
    }
    if (mounted) {
      setState(() {
        _masters = masters;
        _productNames = products;
      });
    }
  }

  Future<void> _locate() async {
    setState(() {
      _locating = true;
      _gpsError = null;
    });
    try {
      final position = await AppPermissions.currentPosition();
      if (mounted) setState(() => _position = position);
    } catch (e) {
      if (mounted) setState(() => _gpsError = e.toString());
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _pickSubject() async {
    final picked = await Navigator.of(context).push<Json>(
      MaterialPageRoute(builder: (_) => DirectoryScreen(initialType: _type, pickMode: true)),
    );
    if (picked != null) setState(() => _subject = picked);
  }

  Future<void> _save() async {
    if (_subject == null) {
      showMessage(context, _type == "doctor" ? "Choose the doctor you visited" : "Choose the firm you visited");
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    if (_position == null) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text("No GPS location"),
          content: const Text("This visit will be saved without a location, and the office will see that. Try GPS again?"),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Save anyway")),
            FilledButton(onPressed: () => Navigator.pop(context, false), child: const Text("Try GPS")),
          ],
        ),
      );
      if (proceed != true) {
        await _locate();
        return;
      }
    }

    setState(() => _saving = true);
    try {
      final subject = _subject!;
      final position = _position;
      await ApiClient.instance.post("/visits", {
        "visitType": _type,
        if (_type == "doctor") "doctor": subject["name"] else "firm": subject["name"],
        "city": subject["city"] ?? "",
        "clinicAddress": subject["clinicAddress"] ?? subject["address"] ?? "",
        "status": _skipped ? "skipped" : "closed",
        "skippedReason": _skipped ? _skippedReason : "",
        "callObjective": _callObjective,
        "postCallInfo": _postCallInfo,
        "products": _products,
        "samples": _samples,
        "gifts": _gifts,
        "pobValue": double.tryParse(_pob.text.trim()) ?? 0,
        "remarks": _remarks.text.trim(),
        "checkInAt": _checkInAt.toUtc().toIso8601String(),
        if (position != null) ...{
          "lat": position.latitude,
          "lng": position.longitude,
          "accuracy": position.accuracy,
        },
      });
      if (position != null && LocationTracker.instance.running.value) {
        await LocationTracker.instance.addFix(position);
      }
      if (!mounted) return;
      showMessage(context, "Visit saved.");
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subjectName = str(_subject?["name"]);
    final subjectDetail = [
      str(_subject?["hospitalName"]),
      str(_subject?["speciality"]),
      str(_subject?["firmType"]),
      str(_subject?["city"]),
    ].where((s) => s.isNotEmpty).join(" · ");

    return Scaffold(
      appBar: AppBar(title: const Text("New visit")),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _GpsBanner(position: _position, error: _gpsError, locating: _locating, onRetry: _locate),
            const SizedBox(height: 16),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: "doctor", label: Text("Doctor"), icon: Icon(Icons.medical_services_rounded)),
                ButtonSegment(value: "firm", label: Text("Chemist / Hospital"), icon: Icon(Icons.storefront_rounded)),
              ],
              selected: {_type},
              onSelectionChanged: (s) => setState(() {
                _type = s.first;
                _subject = null;
              }),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                leading: const Icon(Icons.person_search_rounded, color: AppTheme.indigo),
                title: Text(subjectName.isEmpty ? (_type == "doctor" ? "Choose doctor *" : "Choose chemist / hospital *") : subjectName),
                subtitle: subjectDetail.isEmpty ? null : Text(subjectDetail),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: _pickSubject,
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text("Call could not happen (skipped)"),
              value: _skipped,
              onChanged: (v) => setState(() => _skipped = v),
            ),
            if (_skipped) ...[
              PickerField(
                label: "Reason",
                value: _skippedReason,
                options: _masters["skipped-reason"] ?? const [],
                required: true,
                onChanged: (v) => setState(() => _skippedReason = v),
              ),
            ] else ...[
              PickerField(
                label: "Call objective",
                value: _callObjective,
                options: _masters["call-objective"] ?? const [],
                onChanged: (v) => setState(() => _callObjective = v),
              ),
              const SizedBox(height: 12),
              MultiPickerField(
                label: "Products detailed",
                values: _products,
                options: _productNames,
                onChanged: (v) => setState(() => _products = v),
              ),
              const SizedBox(height: 12),
              MultiPickerField(
                label: "Samples given",
                values: _samples,
                options: _masters["product-sample"]?.isNotEmpty == true ? _masters["product-sample"]! : _productNames,
                onChanged: (v) => setState(() => _samples = v),
              ),
              const SizedBox(height: 12),
              MultiPickerField(
                label: "Gifts given",
                values: _gifts,
                options: _masters["promotional-gift"] ?? const [],
                onChanged: (v) => setState(() => _gifts = v),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pob,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: "POB value (₹)", prefixIcon: Icon(Icons.currency_rupee_rounded)),
              ),
              const SizedBox(height: 12),
              PickerField(
                label: "Post-call information",
                value: _postCallInfo,
                options: _masters["post-call-info"] ?? const [],
                onChanged: (v) => setState(() => _postCallInfo = v),
              ),
            ],
            const SizedBox(height: 12),
            TextFormField(
              controller: _remarks,
              maxLines: 3,
              decoration: const InputDecoration(labelText: "Remarks / survey notes", alignLabelWithHint: true),
            ),
            const SizedBox(height: 8),
            Text("Checked in at ${fmtTime(_checkInAt.toIso8601String())}", style: theme.textTheme.bodySmall),
            const SizedBox(height: 20),
            BusyButton(label: "Save visit", busy: _saving, onPressed: _save, icon: Icons.task_alt_rounded),
          ],
        ),
      ),
    );
  }
}

class _GpsBanner extends StatelessWidget {
  final Position? position;
  final String? error;
  final bool locating;
  final VoidCallback onRetry;
  const _GpsBanner({required this.position, required this.error, required this.locating, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final (color, icon, text) = locating
        ? (AppTheme.indigo, Icons.gps_not_fixed_rounded, "Getting your location…")
        : position != null
            ? (AppTheme.emerald, Icons.gps_fixed_rounded, "Location captured (±${position!.accuracy.round()} m)")
            : (AppTheme.danger, Icons.gps_off_rounded, error ?? "No location");
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          locating
              ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: color))
              : Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w600))),
          if (!locating) TextButton(onPressed: onRetry, child: const Text("Refresh")),
        ],
      ),
    );
  }
}
