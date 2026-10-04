import "package:flutter/material.dart";

import "../models/payment.dart";
import "../models/registration.dart";
import "../services/api_client.dart";
import "survey_doctor_detail_screen.dart";

class SurveyDoctor {
  final Registration registration;
  final List<Payment> payments;

  const SurveyDoctor({required this.registration, required this.payments});
}

class SurveyDoctorListScreen extends StatefulWidget {
  final ApiClient apiClient;

  const SurveyDoctorListScreen({super.key, required this.apiClient});

  @override
  State<SurveyDoctorListScreen> createState() =>
      _SurveyDoctorListScreenState();
}

class _SurveyDoctorListScreenState extends State<SurveyDoctorListScreen> {
  late Future<List<SurveyDoctor>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<SurveyDoctor>> _load() async {
    final doctors = await widget.apiClient.fetchApprovedRegistrations();
    final payments = await widget.apiClient.fetchPayments();
    final approvedPayments = payments
        .where((p) => p.status == "approved")
        .toList();

    final result = <SurveyDoctor>[];
    for (final doctor in doctors) {
      final own = approvedPayments
          .where((p) => p.doctorId == doctor.doctorId)
          .toList();
      if (own.isNotEmpty) {
        result.add(SurveyDoctor(registration: doctor, payments: own));
      }
    }
    return result;
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<SurveyDoctor>>(
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

          final surveyDoctors = snapshot.data!;
          if (surveyDoctors.isEmpty) {
            return ListView(
              children: const [
                Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(
                    child: Text(
                      "No survey papers yet. These appear once a payment "
                      "request for a doctor is approved.",
                    ),
                  ),
                ),
              ],
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: surveyDoctors.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final entry = surveyDoctors[index];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: Text(entry.registration.doctorName),
                  subtitle: Text(
                    "${entry.registration.doctorId} · ${entry.payments.length} survey"
                    "${entry.payments.length == 1 ? '' : 's'}",
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => SurveyDoctorDetailScreen(
                        apiClient: widget.apiClient,
                        doctor: entry.registration,
                        payments: entry.payments,
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
