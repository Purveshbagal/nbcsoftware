import "dart:async";

import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// Doctors and firms (chemists, hospitals, stockists) the employee covers.
/// In [pickMode] tapping a row returns it to the caller.
class DirectoryScreen extends StatefulWidget {
  final String initialType;
  final bool pickMode;
  const DirectoryScreen({super.key, this.initialType = "doctor", this.pickMode = false});

  @override
  State<DirectoryScreen> createState() => _DirectoryScreenState();
}

class _DirectoryScreenState extends State<DirectoryScreen> {
  late String _type = widget.initialType;
  final _loader = GlobalKey<LoadViewState<List<Json>>>();
  String _query = "";
  Timer? _debounce;

  String get _path => _type == "doctor" ? "/doctors" : "/firms";

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<List<Json>> _load() => ApiClient.instance.list(_path, query: _query.isEmpty ? null : {"q": _query});

  void _search(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _query = value.trim();
      _loader.currentState?.reload();
    });
  }

  Future<void> _add() async {
    final created = await Navigator.of(context).push<Json>(
      MaterialPageRoute(builder: (_) => AddContactScreen(type: _type)),
    );
    if (created == null || !mounted) return;
    if (widget.pickMode) {
      Navigator.of(context).pop(created);
    } else {
      _loader.currentState?.reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDoctor = _type == "doctor";
    return Scaffold(
      appBar: AppBar(title: Text(widget.pickMode ? (isDoctor ? "Choose doctor" : "Choose firm") : "Doctors & Firms")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: Text(isDoctor ? "Add doctor" : "Add firm"),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Column(
              children: [
                if (!widget.pickMode) ...[
                  SizedBox(
                    width: double.infinity,
                    child: SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: "doctor", label: Text("Doctors")),
                        ButtonSegment(value: "firm", label: Text("Chemists / Hospitals")),
                      ],
                      selected: {_type},
                      onSelectionChanged: (s) {
                        setState(() => _type = s.first);
                        _loader.currentState?.reload();
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                TextField(
                  decoration: InputDecoration(
                    hintText: isDoctor ? "Search name, hospital or city" : "Search name, contact or city",
                    prefixIcon: const Icon(Icons.search_rounded),
                  ),
                  onChanged: _search,
                ),
              ],
            ),
          ),
          Expanded(
            child: LoadView<List<Json>>(
              key: _loader,
              load: _load,
              builder: (context, items) {
                if (items.isEmpty) {
                  return ListView(
                    children: [
                      EmptyState(
                        icon: isDoctor ? Icons.medical_services_rounded : Icons.storefront_rounded,
                        message: _query.isEmpty
                            ? "Nobody in your area yet. Add the first one with the button below."
                            : "No match for “$_query”.",
                      ),
                    ],
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final item = items[i];
                    final name = isDoctor ? "${str(item["prefix"]).isEmpty ? "Dr" : item["prefix"]}. ${item["name"]}" : str(item["name"]);
                    final detail = isDoctor
                        ? [str(item["speciality"]), str(item["hospitalName"])].where((s) => s.isNotEmpty).join(" · ")
                        : [str(item["firmType"]), str(item["contactPerson"])].where((s) => s.isNotEmpty).join(" · ");
                    final phone = str(item["contactNo"]);
                    return Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                        leading: CircleAvatar(
                          backgroundColor: isDoctor ? const Color(0xFFE8E8FB) : const Color(0xFFDDF5EA),
                          child: Icon(
                            isDoctor ? Icons.medical_services_rounded : Icons.storefront_rounded,
                            color: isDoctor ? AppTheme.indigo : AppTheme.emerald,
                            size: 20,
                          ),
                        ),
                        title: Text(name, style: Theme.of(context).textTheme.titleMedium),
                        subtitle: Text([detail, str(item["city"])].where((s) => s.isNotEmpty).join("\n")),
                        trailing: widget.pickMode
                            ? const Icon(Icons.chevron_right_rounded)
                            : phone.isEmpty
                                ? null
                                : IconButton(
                                    icon: const Icon(Icons.call_rounded, color: AppTheme.emerald),
                                    onPressed: () => launchUrl(Uri.parse("tel:$phone")),
                                  ),
                        onTap: widget.pickMode ? () => Navigator.of(context).pop(item) : null,
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Add a doctor or firm met in the field. Returns the created record.
class AddContactScreen extends StatefulWidget {
  final String type;
  const AddContactScreen({super.key, required this.type});

  @override
  State<AddContactScreen> createState() => _AddContactScreenState();
}

class _AddContactScreenState extends State<AddContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _values = <String, String>{};
  Map<String, List<String>> _masters = {};
  bool _saving = false;

  bool get _isDoctor => widget.type == "doctor";

  @override
  void initState() {
    super.initState();
    ApiClient.instance
        .masters(_isDoctor ? ["doctor-speciality", "qualification", "doctor-category"] : ["firm-type", "firm-category"])
        .then((m) {
      if (mounted) setState(() => _masters = m);
    });
  }

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

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final data = await ApiClient.instance.post(_isDoctor ? "/doctors" : "/firms", _values);
      if (!mounted) return;
      showMessage(context, _isDoctor ? "Doctor added." : "Firm added.");
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
      appBar: AppBar(title: Text(_isDoctor ? "Add doctor" : "Add chemist / hospital")),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_isDoctor) ...[
              _text("name", "Doctor name", required: true),
              _text("hospitalName", "Hospital / clinic"),
              _pick("speciality", "Speciality", "doctor-speciality"),
              _pick("qualification", "Qualification", "qualification"),
              _pick("category", "Category", "doctor-category"),
              _pick("gender", "Gender", "", fallback: const ["male", "female", "other"]),
              _text("contactNo", "Mobile", keyboard: TextInputType.phone),
              _text("email", "Email", keyboard: TextInputType.emailAddress),
              _text("clinicAddress", "Clinic address", lines: 2),
            ] else ...[
              _text("name", "Firm name", required: true),
              _pick("firmType", "Type", "firm-type", fallback: const ["Chemist", "Hospital", "Stockist", "Distributor"]),
              _pick("firmCategory", "Category", "firm-category"),
              _text("contactPerson", "Contact person"),
              _text("contactNo", "Mobile", keyboard: TextInputType.phone),
              _text("email", "Email", keyboard: TextInputType.emailAddress),
              _text("address", "Address", lines: 2),
              _text("gstin", "GSTIN", keyboard: TextInputType.text),
              _text("drugLicenseNumber", "Drug licence no.", keyboard: TextInputType.text),
            ],
            _text("city", "City"),
            _text("pincode", "PIN code", keyboard: TextInputType.number),
            const SizedBox(height: 8),
            BusyButton(label: "Save", busy: _saving, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
