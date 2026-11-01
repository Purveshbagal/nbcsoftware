import "dart:convert";
import "dart:typed_data";

import "package:http/http.dart" as http;
import "package:http_parser/http_parser.dart";

import "../config.dart";
import "../models/payment.dart";
import "../models/product.dart";
import "../models/registration.dart";
import "session_store.dart";

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiClient {
  String? _token;

  void setToken(String? token) {
    _token = token;
  }

  Map<String, String> get _headers {
    final headers = <String, String>{"Content-Type": "application/json"};
    final token = _token;
    if (token != null) headers["Authorization"] = "Bearer $token";
    return headers;
  }

  Future<Session> login(String username, String password) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/auth/login"),
      headers: const {"Content-Type": "application/json"},
      body: jsonEncode({"username": username, "password": password}),
    );
    final data = _decode(res);
    final token = data["token"] as String;
    final user = data["user"] as Map<String, dynamic>;
    _token = token;
    return Session(
      token: token,
      username: user["username"] as String,
      name: user["name"] as String,
    );
  }

  /// Step 1 of OTP login: Sends OTP to user's WhatsApp. Returns masked number.
  Future<String> sendLoginOtp(String username, String password) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/auth/login-with-otp"),
      headers: const {"Content-Type": "application/json"},
      body: jsonEncode({"username": username, "password": password}),
    );
    final data = _decode(res);
    return data["sentTo"] as String? ?? "";
  }

  /// Step 2 of OTP login: Verifies OTP and completes sign-in.
  Future<Session> verifyLoginOtp(String username, String password, String otp) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/auth/verify-login-otp"),
      headers: const {"Content-Type": "application/json"},
      body: jsonEncode({
        "username": username,
        "password": password,
        "otp": otp,
      }),
    );
    final data = _decode(res);
    final token = data["token"] as String;
    final user = data["user"] as Map<String, dynamic>;
    _token = token;
    return Session(
      token: token,
      username: user["username"] as String,
      name: user["name"] as String,
    );
  }

  Future<List<Registration>> fetchRegistrations() async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/registrations"),
      headers: _headers,
    );
    final data = _decode(res);
    final list = data["registrations"] as List<dynamic>;
    return list
        .map((e) => Registration.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Registration>> fetchApprovedRegistrations() async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/registrations?status=approved"),
      headers: _headers,
    );
    final data = _decode(res);
    final list = data["registrations"] as List<dynamic>;
    return list
        .map((e) => Registration.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Product>> fetchProducts() async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/products"),
      headers: _headers,
    );
    final data = _decode(res);
    final list = data["products"] as List<dynamic>;
    return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Map<String, dynamic>>> fetchQualifications() async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/qualifications"),
      headers: _headers,
    );
    final data = _decode(res);
    return _masterRows(data["data"] ?? data["qualifications"]);
  }

  Future<List<Map<String, dynamic>>> fetchSpecialities() async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/specialities"),
      headers: _headers,
    );
    final data = _decode(res);
    return _masterRows(data["data"] ?? data["specialities"]);
  }

  /// Supports both deployed master-data formats: `{ name: "MBBS" }` rows
  /// and the lighter `"MBBS"` string list used by the Labs API.
  List<Map<String, dynamic>> _masterRows(Object? value) => (value as List? ?? const [])
      .map((item) => item is Map<String, dynamic>
          ? item
          : item is Map
              ? Map<String, dynamic>.from(item)
              : {"name": item.toString()})
      .where((item) => (item["name"]?.toString().trim().isNotEmpty ?? false))
      .toList();

  Future<List<Map<String, dynamic>>> fetchDoctors({String? status}) async {
    var url = "$apiBaseUrl/doctors";
    if (status != null) url += "?status=$status";
    final res = await http.get(
      Uri.parse(url),
      headers: _headers,
    );
    final data = _decode(res);
    return (data["data"] as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  }

  Future<Map<String, dynamic>> createDoctor(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/doctors"),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final data = _decode(res);
    return data["data"] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchBudgetAnalytics({String period = "this_month"}) async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/analytics/budget?period=$period"),
      headers: _headers,
    );
    return _decode(res);
  }

  Future<Registration> createRegistration(
    Map<String, dynamic> payload,
  ) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/registrations"),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final data = _decode(res);
    return Registration.fromJson(
      data["registration"] as Map<String, dynamic>,
    );
  }

  Future<List<Payment>> fetchPayments() async {
    final res = await http.get(
      Uri.parse("$apiBaseUrl/payments"),
      headers: _headers,
    );
    final data = _decode(res);
    final list = data["payments"] as List<dynamic>;
    return list.map((e) => Payment.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Payment?> fetchPayment(String id) async {
    final payments = await fetchPayments();
    final matches = payments.where((p) => p.id == id);
    return matches.isEmpty ? null : matches.first;
  }

  Future<Payment> createPayment(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/payments"),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final data = _decode(res);
    return Payment.fromJson(data["payment"] as Map<String, dynamic>);
  }

  /// Sends an OTP to the doctor's WhatsApp number. Returns the masked number.
  Future<String> sendHandOverOtp(String paymentId) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/payments/$paymentId/hand-over/send-otp"),
      headers: _headers,
    );
    final data = _decode(res);
    return data["sentTo"] as String? ?? "";
  }

  /// Records that the rep has handed the admin-disbursed cash to the doctor.
  /// [otp] is the code the doctor received on WhatsApp.
  Future<Payment> handOverPayment(String paymentId, String otp) async {
    final res = await http.post(
      Uri.parse("$apiBaseUrl/payments/$paymentId/hand-over"),
      headers: _headers,
      body: jsonEncode({"otp": otp}),
    );
    final data = _decode(res);
    return Payment.fromJson(data["payment"] as Map<String, dynamic>);
  }

  Future<Uint8List> downloadSurveyPdf(String paymentId) async {
    return _downloadPdf(
      "$apiBaseUrl/payments/$paymentId/survey-pdf",
      "Failed to download survey form",
    );
  }

  Future<Uint8List> downloadReceiptPdf(String paymentId) async {
    return _downloadPdf(
      "$apiBaseUrl/payments/$paymentId/receipt-pdf",
      "Failed to download receipt",
    );
  }

  Future<Uint8List> _downloadPdf(String url, String errorPrefix) async {
    final res = await http.get(Uri.parse(url), headers: _headers);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      Map<String, dynamic> data = {};
      try {
        data = jsonDecode(res.body) as Map<String, dynamic>;
      } catch (_) {
        // Non-JSON error body; fall through with a generic message.
      }
      throw ApiException(
        data["error"] as String? ?? "$errorPrefix (${res.statusCode})",
      );
    }
    return res.bodyBytes;
  }

  Future<void> uploadSurveyFile(
    String paymentId, {
    required Uint8List bytes,
    required String filename,
    required String mimeType,
  }) async {
    final uri = Uri.parse("$apiBaseUrl/payments/$paymentId/survey-upload");
    final request = http.MultipartRequest("POST", uri);
    final token = _token;
    if (token != null) request.headers["Authorization"] = "Bearer $token";
    request.files.add(
      http.MultipartFile.fromBytes(
        "file",
        bytes,
        filename: filename,
        contentType: MediaType.parse(mimeType),
      ),
    );

    final streamedResponse = await request.send();
    final res = await http.Response.fromStream(streamedResponse);
    _decode(res);
  }

  Map<String, dynamic> _decode(http.Response res) {
    final data = res.body.isNotEmpty
        ? jsonDecode(res.body) as Map<String, dynamic>
        : <String, dynamic>{};
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException(
        data["error"] as String? ?? "Request failed (${res.statusCode})",
      );
    }
    return data;
  }
}
