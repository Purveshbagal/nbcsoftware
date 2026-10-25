import "dart:convert";
import "package:flutter/material.dart";
import "package:file_picker/file_picker.dart";
import "package:geolocator/geolocator.dart";
import "package:url_launcher/url_launcher.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";
import "products_promoted_screen.dart";
import "samples_given_screen.dart";

/// Visit Detail Screen
/// Shows visit details, allows check-in, photo upload, and closing visit
class VisitDetailScreen extends StatefulWidget {
  final String visitId;

  const VisitDetailScreen({super.key, required this.visitId});

  @override
  State<VisitDetailScreen> createState() => _VisitDetailScreenState();
}

class _VisitDetailScreenState extends State<VisitDetailScreen> {
  Map<String, dynamic>? _visit;
  bool _loading = true;
  bool _checkingIn = false;
  bool _uploadingPhoto = false;
  List<String> _photos = [];

  @override
  void initState() {
    super.initState();
    _loadVisit();
  }

  Future<void> _loadVisit() async {
    setState(() => _loading = true);
    try {
      final data = await ApiClient.instance.get("/visits/${widget.visitId}");
      setState(() {
        _visit = data["visit"];
        _photos = List<String>.from(_visit!["photos"] ?? []);
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        showError(context, "Failed to load visit: $e");
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _checkIn() async {
    setState(() => _checkingIn = true);
    try {
      // Get current location
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final payload = {"lat": position.latitude, "lng": position.longitude, "accuracy": position.accuracy};

      await ApiClient.instance.put(
        "/visits/${widget.visitId}/check-in",
        payload,
      );

      if (mounted) {
        showMessage(context, "Checked in successfully!");
        _loadVisit(); // Refresh
      }
    } catch (e) {
      if (mounted) showError(context, "Check-in failed: $e");
    } finally {
      if (mounted) setState(() => _checkingIn = false);
    }
  }

  Future<void> _getDirections() async {
    final geo = _visit?["geo"] as Map?;
    final lat = geo?["lat"];
    final lng = geo?["lng"];
    final destination = lat != null && lng != null
        ? "$lat,$lng"
        : (_visit?["clinicAddress"]?.toString().trim().isNotEmpty == true
            ? _visit!["clinicAddress"].toString()
            : _visit?["doctor"]?.toString() ?? "");
    if (destination.isEmpty) {
      if (mounted) showError(context, "This visit has no doctor address or location.");
      return;
    }
    final uri = Uri.https("www.google.com", "/maps/dir/", {"api": "1", "destination": destination});
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      showError(context, "Could not open Maps.");
    }
  }

  Future<void> _uploadPhoto() async {
    try {
      setState(() => _uploadingPhoto = true);

      final files = await FilePicker.pickFiles(
        type: FileType.image,
      );

      if (files != null && files.isNotEmpty) {
        final file = files.first;
        final bytes = await file.readAsBytes();

        if (bytes != null) {
          final base64Image = base64Encode(bytes);

          // Update visit with new photo
          final currentPhotos = List<String>.from(_visit!["photos"] ?? []);
          currentPhotos.add(base64Image);

          await ApiClient.instance.patch("/visits/${widget.visitId}", {
            "photos": currentPhotos,
          });

          if (mounted) {
            showMessage(context, "Photo uploaded!");
            _loadVisit(); // Refresh
          }
        }
      }
    } catch (e) {
      if (mounted) showError(context, "Photo upload failed: $e");
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _closeVisit() async {
    final metDoctor = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Did you meet the doctor?"),
        content: const Text("Choose Yes to record products and samples, or No to close with a reason."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
          OutlinedButton(onPressed: () => Navigator.pop(context, false), child: const Text("No")),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text("Yes")),
        ],
      ),
    );
    if (metDoctor == null) return;
    if (!metDoctor) {
      final reason = await _reasonForNoVisit();
      if (reason == null || reason.isEmpty) return;
      await ApiClient.instance.put("/visits/${widget.visitId}/close", {"metDoctor": false, "notMetReason": reason});
      if (mounted) Navigator.of(context).pop(true);
      return;
    }
    // Navigate to Products Promoted screen first
    final productsPromoted = await Navigator.of(context).push<List<Map<String, dynamic>>>(
      MaterialPageRoute(
        builder: (_) => ProductsPromotedScreen(visitId: widget.visitId),
      ),
    );

    if (productsPromoted == null) return; // User cancelled

    // Navigate to Samples Given screen
    if (!mounted) return;
    final samplesGiven = await Navigator.of(context).push<List<Map<String, dynamic>>>(
      MaterialPageRoute(
        builder: (_) => SamplesGivenScreen(visitId: widget.visitId),
      ),
    );

    if (samplesGiven == null) return; // User cancelled

    // Show close visit dialog
    if (!mounted) return;
    final closeDetails = await showDialog<Map<String, String>>(
      context: context,
      builder: (context) {
        final objective = TextEditingController();
        final remarks = TextEditingController();
        final extraInfo = TextEditingController();
        return AlertDialog(
          title: const Text("Close Visit"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Products Promoted: ${productsPromoted.length}\n"
                "Samples Given: ${samplesGiven.length}",
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 16),
              TextField(controller: objective, decoration: const InputDecoration(labelText: "Call objective", border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(
                controller: remarks,
                decoration: const InputDecoration(
                  labelText: "Remarks (Optional)",
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextField(controller: extraInfo, decoration: const InputDecoration(labelText: "Any important information", border: OutlineInputBorder()), maxLines: 3),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop({"objective": objective.text.trim(), "remarks": remarks.text.trim(), "extraInfo": extraInfo.text.trim()}),
              child: const Text("Close Visit"),
            ),
          ],
        );
      },
    );

    if (closeDetails == null) return; // User cancelled

    // Close the visit
    try {
      final payload = {
        "metDoctor": true,
        "productsPromoted": productsPromoted,
        "samplesGiven": samplesGiven,
        "callObjective": closeDetails["objective"],
        "remarks": closeDetails["remarks"],
        "extraInfo": closeDetails["extraInfo"],
      };

      await ApiClient.instance.put("/visits/${widget.visitId}/close", payload);

      if (!mounted) return;
      showMessage(context, "Visit closed successfully!");
      Navigator.of(context).pop(true); // Return to list
    } catch (e) {
      if (mounted) showError(context, "Failed to close visit: $e");
    }
  }

  Future<String?> _reasonForNoVisit() async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Why was the doctor not met?"),
        content: TextField(controller: controller, autofocus: true, maxLines: 3, decoration: const InputDecoration(labelText: "Reason *")),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
          FilledButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text("Close visit")),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _visit == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Visit Details")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final doctor = _visit!["doctor"];
    final status = _visit!["status"] ?? "planned";
    final doctorName = doctor is Map ? doctor["name"]?.toString() ?? "Unknown Doctor" : doctor?.toString() ?? "Unknown Doctor";
    final hospitalName = doctor is Map ? doctor["hospitalName"]?.toString() ?? "" : _visit!["clinicAddress"]?.toString() ?? "";
    final plannedDate = _visit!["plannedDate"] != null
        ? DateTime.parse(_visit!["plannedDate"])
        : null;
    final checkedInAt = _visit!["checkedInAt"] != null
        ? DateTime.parse(_visit!["checkedInAt"])
        : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Visit Details"),
        actions: [
          if (status == "open")
            IconButton(
              onPressed: _closeVisit,
              icon: const Icon(Icons.check_circle, color: Colors.white),
              tooltip: "Close Visit",
              iconSize: 28,
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Doctor Info Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctorName,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    hospitalName,
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 12),
                  Divider(color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  if (plannedDate != null)
                    _buildInfoRow(
                      Icons.calendar_today,
                      "Planned Date",
                      "${plannedDate.day}/${plannedDate.month}/${plannedDate.year}",
                    ),
                  if (checkedInAt != null)
                    _buildInfoRow(
                      Icons.login,
                      "Checked In",
                      "${checkedInAt.hour}:${checkedInAt.minute.toString().padLeft(2, '0')}",
                    ),
                  if (_visit!["modeOfTransport"] != null)
                    _buildInfoRow(
                      Icons.directions_car,
                      "Transport",
                      _visit!["modeOfTransport"],
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          OutlinedButton.icon(
            onPressed: _getDirections,
            icon: const Icon(Icons.directions),
            label: const Text("Get directions"),
          ),
          const SizedBox(height: 12),

          // Check-in Button (if planned)
          if (status == "planned")
            ElevatedButton.icon(
              onPressed: _checkingIn ? null : _checkIn,
              icon: _checkingIn
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.location_on),
              label: const Text("I Am Here (Check In)"),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
            ),

          const SizedBox(height: 16),

          // Photos Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Photos",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (status == "open")
                        TextButton.icon(
                          onPressed: _uploadingPhoto ? null : _uploadPhoto,
                          icon: _uploadingPhoto
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.add_a_photo, size: 18),
                          label: const Text("Add Photo"),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_photos.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(
                              Icons.photo_library,
                              size: 48,
                              color: Colors.grey.shade300,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              "No photos yet",
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemCount: _photos.length,
                      itemBuilder: (context, index) {
                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.photo,
                            size: 32,
                            color: AppTheme.indigo,
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.indigo),
          const SizedBox(width: 8),
          Text(
            "$label:",
            style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
