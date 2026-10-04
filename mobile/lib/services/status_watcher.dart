import "../models/payment.dart";
import "../models/registration.dart";
import "api_client.dart";
import "notification_service.dart";

// Polls registrations/payments and fires a local notification whenever an
// admin decision (approve/reject) or a payment-given event is detected,
// so the field rep finds out without having to open the relevant screen.
class StatusWatcher {
  final ApiClient apiClient;

  Map<String, String> _registrationStage = {};
  Map<String, String> _paymentStage = {};
  bool _primed = false;

  StatusWatcher(this.apiClient);

  String _paymentStageOf(Payment p) {
    if (p.status == "rejected") return "rejected";
    if (p.status == "pending") return "pending";
    if (p.paymentGiven) return "paid";
    return "approved";
  }

  Future<void> check() async {
    List<Registration> registrations;
    List<Payment> payments;
    try {
      registrations = await apiClient.fetchRegistrations();
      payments = await apiClient.fetchPayments();
    } catch (_) {
      return;
    }

    final nextRegistrationStage = <String, String>{
      for (final r in registrations) r.id: r.status,
    };
    final nextPaymentStage = <String, String>{
      for (final p in payments) p.id: _paymentStageOf(p),
    };

    if (!_primed) {
      _registrationStage = nextRegistrationStage;
      _paymentStage = nextPaymentStage;
      _primed = true;
      return;
    }

    for (final r in registrations) {
      final previous = _registrationStage[r.id];
      if (previous != null && previous != r.status) {
        if (r.status == "approved") {
          await NotificationService.instance.show(
            "Registration approved",
            "Dr. ${r.doctorName} has been approved.",
          );
        } else if (r.status == "rejected") {
          await NotificationService.instance.show(
            "Registration rejected",
            "Dr. ${r.doctorName}'s registration was rejected.",
          );
        }
      }
    }

    for (final p in payments) {
      final previous = _paymentStage[p.id];
      final current = nextPaymentStage[p.id];
      if (previous != null && previous != current) {
        if (current == "approved") {
          await NotificationService.instance.show(
            "Payment request approved",
            "Dr. ${p.doctorName} — ${p.productName} was approved.",
          );
        } else if (current == "rejected") {
          await NotificationService.instance.show(
            "Payment request rejected",
            "Dr. ${p.doctorName} — ${p.productName} was rejected.",
          );
        } else if (current == "paid") {
          await NotificationService.instance.show(
            "Receipt generated",
            "Payment of ₹${p.netAmount ?? p.amount} given for "
                "Dr. ${p.doctorName}. Receipt ${p.receiptNumber ?? ""} is "
                "ready to download.",
          );
        }
      }
    }

    _registrationStage = nextRegistrationStage;
    _paymentStage = nextPaymentStage;
  }
}
