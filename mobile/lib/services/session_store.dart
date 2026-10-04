import "package:shared_preferences/shared_preferences.dart";

class Session {
  final String token;
  final String username;
  final String name;

  const Session({
    required this.token,
    required this.username,
    required this.name,
  });
}

class SessionStore {
  static const _tokenKey = "auth_token";
  static const _usernameKey = "auth_username";
  static const _nameKey = "auth_name";

  Future<void> save(Session session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, session.token);
    await prefs.setString(_usernameKey, session.username);
    await prefs.setString(_nameKey, session.name);
  }

  Future<Session?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final username = prefs.getString(_usernameKey);
    final name = prefs.getString(_nameKey);
    if (token == null || username == null || name == null) return null;
    return Session(token: token, username: username, name: name);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_usernameKey);
    await prefs.remove(_nameKey);
  }
}
