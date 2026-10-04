import "dart:async";
import "dart:convert";

import "package:http/http.dart" as http;

import "../config.dart";

typedef Json = Map<String, dynamic>;

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Thin JSON client for `/api/labs`. Every screen goes through here so that a
/// revoked login (401) is handled in one place.
class ApiClient {
  ApiClient._();
  static final instance = ApiClient._();

  static const _timeout = Duration(seconds: 25);

  String? _token;

  /// Called once when the server rejects the token — the app signs out.
  void Function()? onUnauthorized;

  set token(String? value) => _token = value;
  bool get hasToken => _token != null;

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (_token != null) "Authorization": "Bearer $_token",
  };

  Uri _uri(String path, [Map<String, String>? query]) {
    final uri = Uri.parse("$apiBaseUrl$path");
    return query == null || query.isEmpty ? uri : uri.replace(queryParameters: query);
  }

  Future<Json> get(String path, {Map<String, String>? query}) =>
      _send(() => http.get(_uri(path, query), headers: _headers));

  Future<Json> post(String path, [Object? body]) =>
      _send(() => http.post(_uri(path), headers: _headers, body: jsonEncode(body ?? {})));

  Future<Json> patch(String path, [Object? body]) =>
      _send(() => http.patch(_uri(path), headers: _headers, body: jsonEncode(body ?? {})));

  /// A list endpoint that answers `{ items: [...] }`.
  Future<List<Json>> list(String path, {Map<String, String>? query}) async {
    final data = await get(path, query: query);
    return ((data["items"] as List?) ?? const []).cast<Json>();
  }

  Future<Json> _send(Future<http.Response> Function() request) async {
    http.Response res;
    try {
      res = await request().timeout(_timeout);
    } on TimeoutException {
      throw ApiException("The server is taking too long. Check your internet and try again.");
    } catch (_) {
      throw ApiException("No internet connection. Check your network and try again.");
    }

    Json data;
    try {
      final decoded = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
      data = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    } catch (_) {
      data = {};
    }

    if (res.statusCode >= 200 && res.statusCode < 300) return data;

    final message = (data["error"] as String?) ?? "Something went wrong (${res.statusCode}).";
    if (res.statusCode == 401 && _token != null) {
      onUnauthorized?.call();
    }
    throw ApiException(message, statusCode: res.statusCode);
  }

  // ---- Masters (dropdown values) are cached for the session ----

  final Map<String, List<String>> _masterCache = {};

  Future<Map<String, List<String>>> masters(List<String> types) async {
    final missing = types.where((t) => !_masterCache.containsKey(t)).toList();
    if (missing.isNotEmpty) {
      try {
        final data = await get("/masters", query: {"types": missing.join(",")});
        final options = (data["options"] as Map?) ?? {};
        for (final type in missing) {
          final rows = (options[type] as List?) ?? const [];
          _masterCache[type] = rows.map((r) => (r as Map)["name"].toString()).toList();
        }
      } on ApiException {
        // Dropdowns fall back to free text when masters cannot be loaded.
        for (final type in missing) {
          _masterCache[type] = const [];
        }
      }
    }
    return {for (final t in types) t: _masterCache[t] ?? const []};
  }

  void clearCache() => _masterCache.clear();
}
