import "dart:async";
import "dart:convert";

import "package:battery_plus/battery_plus.dart";
import "package:flutter/foundation.dart";
import "package:geolocator/geolocator.dart";
import "package:shared_preferences/shared_preferences.dart";

import "../config.dart";
import "api_client.dart";

/// Shares the employee's location with the office while they are on duty —
/// from punch-in to punch-out, and only then.
///
/// Fixes come from Geolocator's foreground service, which shows a persistent
/// notification and keeps running with the screen off. Each fix is queued on
/// the device first and uploaded in batches, so nothing is lost in areas with
/// no signal.
class LocationTracker {
  LocationTracker._();
  static final instance = LocationTracker._();

  static const _queueKey = "labs_location_queue";
  static const _maxQueued = 3000;
  static const _batchSize = 200;
  static const _heartbeat = Duration(minutes: 10);

  final _battery = Battery();
  final running = ValueNotifier<bool>(false);

  StreamSubscription<Position>? _subscription;
  Timer? _uploadTimer;
  Timer? _heartbeatTimer;
  List<Map<String, dynamic>> _queue = [];
  bool _uploading = false;
  DateTime? _lastFixAt;

  int get pendingUploads => _queue.length;

  /// Start sharing. Returns false when location permission is missing.
  Future<bool> start() async {
    if (running.value) return true;

    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      return false;
    }

    await _loadQueue();

    final settings = AndroidSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: trackingDistanceFilterMeters,
      intervalDuration: trackingInterval,
      foregroundNotificationConfig: const ForegroundNotificationConfig(
        notificationTitle: "NBC Labs · On duty",
        notificationText: "Your location is shared with the office until you punch out.",
        notificationChannelName: "Duty tracking",
        enableWakeLock: true,
        setOngoing: true,
      ),
    );

    _subscription = Geolocator.getPositionStream(locationSettings: settings).listen(
      _record,
      onError: (Object error) => debugPrint("Location stream error: $error"),
    );

    _uploadTimer = Timer.periodic(uploadInterval, (_) => upload());

    // Standing still produces no fixes because of the distance filter, so take
    // one now and then — the office then knows the phone is still alive.
    _heartbeatTimer = Timer.periodic(_heartbeat, (_) async {
      final last = _lastFixAt;
      if (last != null && DateTime.now().difference(last) < _heartbeat) return;
      try {
        _record(await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 30)),
        ));
      } catch (_) {}
    });

    running.value = true;
    return true;
  }

  Future<void> stop() async {
    await _subscription?.cancel();
    _subscription = null;
    _uploadTimer?.cancel();
    _heartbeatTimer?.cancel();
    _uploadTimer = null;
    _heartbeatTimer = null;
    running.value = false;
    await upload();
  }

  /// Add a fix taken elsewhere (punch, visit) to the trail.
  Future<void> addFix(Position position) => _record(position);

  Future<void> _record(Position position) async {
    _lastFixAt = DateTime.now();
    int? battery;
    try {
      battery = await _battery.batteryLevel;
    } catch (_) {}

    _queue.add({
      "lat": position.latitude,
      "lng": position.longitude,
      "accuracy": position.accuracy,
      "speed": position.speed,
      "at": position.timestamp.toUtc().toIso8601String(),
      "battery": ?battery,
    });
    if (_queue.length > _maxQueued) {
      _queue = _queue.sublist(_queue.length - _maxQueued);
    }
    await _saveQueue();

    if (_queue.length >= 5) unawaited(upload());
  }

  /// Send everything queued. Safe to call any time; overlapping calls merge.
  Future<void> upload() async {
    if (_uploading || !ApiClient.instance.hasToken) return;
    _uploading = true;
    try {
      if (_queue.isEmpty) await _loadQueue();
      while (_queue.isNotEmpty) {
        final batch = _queue.take(_batchSize).toList();
        await ApiClient.instance.post("/location", {"points": batch});
        _queue.removeRange(0, batch.length);
        await _saveQueue();
      }
    } on ApiException catch (error) {
      // Offline or server busy: keep the queue and try again on the next tick.
      // A rejected batch (400) would block the queue forever, so drop it.
      if (error.statusCode == 400) {
        _queue.removeRange(0, _queue.length.clamp(0, _batchSize));
        await _saveQueue();
      }
    } finally {
      _uploading = false;
    }
  }

  /// Forget everything queued — used on sign-out.
  Future<void> clear() async {
    await stop();
    _queue = [];
    await _saveQueue();
  }

  Future<void> _loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw == null) return;
    try {
      final stored = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      // Keep anything recorded since the last load that is not yet stored.
      _queue = [...stored, ..._queue.where((p) => !stored.any((s) => s["at"] == p["at"]))];
    } catch (_) {}
  }

  Future<void> _saveQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_queueKey, jsonEncode(_queue));
  }
}
