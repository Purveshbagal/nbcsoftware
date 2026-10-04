import "package:flutter_local_notifications/flutter_local_notifications.dart";

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  int _nextId = 0;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    const androidSettings = AndroidInitializationSettings(
      "@mipmap/ic_launcher",
    );
    await _plugin.initialize(
      settings: const InitializationSettings(android: androidSettings),
    );

    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
  }

  Future<void> show(String title, String body) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        "nbc_pedia_updates",
        "Updates",
        channelDescription: "Approval, rejection and payment updates",
        importance: Importance.high,
        priority: Priority.high,
      ),
    );
    await _plugin.show(
      id: _nextId++,
      title: title,
      body: body,
      notificationDetails: details,
    );
  }
}
