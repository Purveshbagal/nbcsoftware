import "dart:convert";

import "package:shared_preferences/shared_preferences.dart";

class Session {
  final String token;
  final String employeeId;
  final String username;
  final String name;
  final String designation;
  final String zone;

  const Session({
    required this.token,
    required this.employeeId,
    required this.username,
    required this.name,
    required this.designation,
    required this.zone,
  });

  factory Session.fromLogin(Map<String, dynamic> data) {
    final employee = data["employee"] as Map<String, dynamic>;
    return Session(
      token: data["token"] as String,
      employeeId: employee["id"] as String,
      username: (employee["username"] ?? "") as String,
      name: (employee["name"] ?? "") as String,
      designation: (employee["designation"] ?? "") as String,
      zone: (employee["zone"] ?? "") as String,
    );
  }

  Map<String, dynamic> toJson() => {
    "token": token,
    "employeeId": employeeId,
    "username": username,
    "name": name,
    "designation": designation,
    "zone": zone,
  };

  factory Session.fromJson(Map<String, dynamic> json) => Session(
    token: json["token"] as String,
    employeeId: json["employeeId"] as String,
    username: (json["username"] ?? "") as String,
    name: (json["name"] ?? "") as String,
    designation: (json["designation"] ?? "") as String,
    zone: (json["zone"] ?? "") as String,
  );
}

/// Stores the signed-in session and first-run flags on the device.
class SessionStore {
  SessionStore._();
  static final instance = SessionStore._();

  static const _sessionKey = "labs_session";
  static const _onboardedKey = "labs_permissions_onboarded";

  Future<void> save(Session session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, jsonEncode(session.toJson()));
  }

  Future<Session?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    if (raw == null) return null;
    try {
      return Session.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      await prefs.remove(_sessionKey);
      return null;
    }
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }

  Future<bool> isOnboarded() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardedKey) ?? false;
  }

  Future<void> setOnboarded() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardedKey, true);
  }
}
