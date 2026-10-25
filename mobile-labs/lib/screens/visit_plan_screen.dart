import "package:flutter/material.dart";
import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// Plan Visit Screen
/// User selects doctor, date, and transport mode
class VisitPlanScreen extends StatefulWidget {
  const VisitPlanScreen({super.key});

  @override
  State<VisitPlanScreen> createState() => _VisitPlanScreenState();
}

class _VisitPlanScreenState extends State<VisitPlanScreen> {
  final _formKey = GlobalKey<FormState>();
  List<dynamic> _doctors = [];
  String? _selectedDoctorId;
  String? _selectedDoctorName;
  DateTime _selectedDate = DateTime.now();
  String _transportMode = "Bike";
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    try {
      // Labs has no `/contacts` endpoint. Doctors are served from `/doctors`.
      final data = await ApiClient.instance.get("/doctors");
      setState(() {
        _doctors = data["items"] ?? [];
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        showError(context, "Failed to load doctors: $e");
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _planVisit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDoctorId == null) {
      showError(context, "Please select a doctor");
      return;
    }

    setState(() => _saving = true);
    try {
      final payload = {
        "doctorId": _selectedDoctorId,
        "doctorName": _selectedDoctorName,
        "plannedDate": _selectedDate.toIso8601String(),
        "modeOfTransport": _transportMode,
      };

      await ApiClient.instance.post("/visits/plan", payload);

      if (!mounted) return;
      showMessage(context, "Visit planned successfully!");
      Navigator.of(context).pop(true); // Return true to refresh list
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Plan Visit")),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Doctor Selection
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.indigo.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Select Doctor",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: _selectedDoctorId,
                          decoration: const InputDecoration(
                            labelText: "Doctor *",
                            border: OutlineInputBorder(),
                          ),
                          items: _doctors.map((doctor) {
                            return DropdownMenuItem<String>(
                              value: doctor["_id"],
                              child: Text(
                                "${doctor["name"]} - ${doctor["hospitalName"] ?? "N/A"}",
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedDoctorId = value;
                              _selectedDoctorName = _doctors
                                  .firstWhere((d) => d["_id"] == value)["name"];
                            });
                          },
                          validator: (v) =>
                              v == null ? "Please select a doctor" : null,
                        ),
                      ],
                    ),
                  ),

                  // Date Selection
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.calendar_today, color: AppTheme.indigo),
                      title: const Text("Visit Date"),
                      subtitle: Text(
                        "${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _selectedDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (date != null) {
                          setState(() => _selectedDate = date);
                        }
                      },
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Transport Mode
                  const Text(
                    "Mode of Transport",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ...["Bike", "Car", "Public Transport"].map((mode) {
                    return RadioListTile<String>(
                      title: Text(mode),
                      value: mode,
                      groupValue: _transportMode,
                      onChanged: (v) => setState(() => _transportMode = v!),
                      activeColor: AppTheme.indigo,
                    );
                  }).toList(),

                  const SizedBox(height: 24),
                  BusyButton(
                    label: "Plan Visit",
                    busy: _saving,
                    onPressed: _planVisit,
                  ),
                ],
              ),
            ),
    );
  }
}
