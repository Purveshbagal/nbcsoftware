import "package:device_info_plus/device_info_plus.dart";
import "package:geolocator/geolocator.dart";
import "package:permission_handler/permission_handler.dart";

class LocationUnavailable implements Exception {
  final String message;
  LocationUnavailable(this.message);
  @override
  String toString() => message;
}

/// Runtime permissions the app needs, and a GPS fix that explains itself
/// when it cannot be taken.
abstract final class AppPermissions {
  static int? _sdk;

  static Future<int> androidSdk() async {
    return _sdk ??= (await DeviceInfoPlugin().androidInfo).version.sdkInt;
  }

  /// Photos on Android 13+, shared storage before that.
  static Future<Permission> storagePermission() async =>
      await androidSdk() >= 33 ? Permission.photos : Permission.storage;

  static Future<bool> locationGranted() async => (await Permission.locationWhenInUse.status).isGranted;

  static Future<bool> backgroundLocationGranted() async => (await Permission.locationAlways.status).isGranted;

  static Future<bool> requestLocation() async {
    final status = await Permission.locationWhenInUse.request();
    return status.isGranted;
  }

  /// "Allow all the time". Android only offers it after foreground location
  /// is granted, and on 11+ it opens the app's settings page.
  static Future<bool> requestBackgroundLocation() async {
    if (!await locationGranted()) {
      if (!await requestLocation()) return false;
    }
    final status = await Permission.locationAlways.request();
    return status.isGranted;
  }

  static Future<bool> requestNotifications() async {
    if (await androidSdk() < 33) return true;
    return (await Permission.notification.request()).isGranted;
  }

  static Future<bool> notificationsGranted() async {
    if (await androidSdk() < 33) return true;
    return (await Permission.notification.status).isGranted;
  }

  static Future<bool> requestStorage() async {
    final permission = await storagePermission();
    final status = await permission.request();
    return status.isGranted || status.isLimited;
  }

  static Future<bool> storageGranted() async {
    final status = await (await storagePermission()).status;
    return status.isGranted || status.isLimited;
  }

  /// Keeps Android's battery saver from freezing tracking while on duty.
  static Future<bool> requestBatteryExemption() async =>
      (await Permission.ignoreBatteryOptimizations.request()).isGranted;

  static Future<bool> batteryExemptionGranted() async =>
      (await Permission.ignoreBatteryOptimizations.status).isGranted;

  /// A fresh, accurate fix — or a [LocationUnavailable] saying what to fix.
  static Future<Position> currentPosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      await Geolocator.openLocationSettings();
      throw LocationUnavailable("GPS is off. Turn on Location and try again.");
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw LocationUnavailable("Location permission is needed for this.");
    }
    if (permission == LocationPermission.deniedForever) {
      await openAppSettings();
      throw LocationUnavailable("Location permission is blocked. Allow it in Settings → Permissions → Location.");
    }
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 20)),
      );
    } catch (_) {
      final last = await Geolocator.getLastKnownPosition();
      if (last != null) return last;
      throw LocationUnavailable("Could not get your location. Move to an open area and try again.");
    }
  }
}
