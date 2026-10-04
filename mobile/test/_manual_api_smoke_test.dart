// Manual, opt-in smoke test that exercises ApiClient against a live backend.
// Not run as part of the normal test suite (see @Skip below) — run explicitly
// with `flutter test test/_manual_api_smoke_test.dart --run-skipped` while
// `npm run dev` is running locally, with a seeded product catalog and a
// "fielduser1" / "pass1234" field user.
@Skip("manual: requires a live local backend")
library;

import "dart:convert";

import "package:flutter/foundation.dart";
import "package:flutter_test/flutter_test.dart";
import "package:http/http.dart" as http;
import "package:nbc_pedia_field/config.dart";
import "package:nbc_pedia_field/services/api_client.dart";

Future<void> _approveAsAdmin(String paymentOrRegPath, String id) async {
  final loginRes = await http.post(
    Uri.parse("$apiBaseUrl/auth/login"),
    headers: {"Content-Type": "application/json"},
    body: jsonEncode({"username": "admin", "password": "123456"}),
  );
  final token = (jsonDecode(loginRes.body) as Map)["token"] as String;

  await http.patch(
    Uri.parse("$apiBaseUrl/$paymentOrRegPath/$id"),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    },
    body: jsonEncode({"status": "approved"}),
  );
}

void main() {
  test("login, register, payment, survey download/upload round-trip", () async {
    // flutter_test defaults defaultTargetPlatform to android for
    // consistency; override it so apiBaseUrl resolves to localhost like it
    // would on desktop/web, matching how this machine actually runs it.
    debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
    addTearDown(() => debugDefaultTargetPlatformOverride = null);

    final client = ApiClient();

    final session = await client.login("fielduser1", "pass1234");
    // ignore: avoid_print
    print("Logged in as ${session.name} (${session.username})");

    final registration = await client.createRegistration({
      "doctorName": "Dr. Smoke Test",
      "registrationNumber": "REG-SMOKE-${DateTime.now().millisecondsSinceEpoch}",
    });
    expect(registration.doctorId, isNotEmpty);
    await _approveAsAdmin("registrations", registration.id);

    final products = await client.fetchProducts();
    expect(products, isNotEmpty);

    final approvedDoctors = await client.fetchApprovedRegistrations();
    expect(
      approvedDoctors.any((d) => d.doctorId == registration.doctorId),
      isTrue,
    );

    final payment = await client.createPayment({
      "doctorId": registration.doctorId,
      "productId": products.first.id,
      "amount": "2500",
      "purpose": "Smoke test payout",
    });
    expect(payment.amount, 2500);
    expect(payment.status, "pending");
    await _approveAsAdmin("payments", payment.id);

    final pdfBytes = await client.downloadSurveyPdf(payment.id);
    expect(pdfBytes.length, greaterThan(100));
    expect(String.fromCharCodes(pdfBytes.take(4)), "%PDF");

    await client.uploadSurveyFile(
      payment.id,
      bytes: Uint8List.fromList([0xFF, 0xD8, 0xFF, 0xD9]),
      filename: "test.jpg",
      mimeType: "image/jpeg",
    );

    final payments = await client.fetchPayments();
    final updated = payments.where((p) => p.id == payment.id).first;
    expect(updated.surveyFormNo, isNotNull);
    expect(updated.surveyUploaded, isTrue);
  });
}
