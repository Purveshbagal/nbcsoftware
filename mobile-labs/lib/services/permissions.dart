import "package:device_info_plus/device_info_plus.dart";
import "package:geolocator/geolocator.dart";
import "package:permission_handler/permission_handler.dart";

class LocationUnavailable implements Exception {
  final String message;
  LocationUnavailable(this.message);
  @override
  String toString() => message;
}

/// The two permissions the app asks for: location, and storage for saving
/// downloaded files. Duty tracking runs as a foreground service started while
/// the app is open, so "while using the app" location is enough.
abstract final class AppPermissions {
  static int? _sdk;

  static Future<int> _androidSdk() async {
    return _sdk ??= (await DeviceInfoPlugin().androidInfo).version.sdkInt;
  }

  /// Ask for location, then storage, each with the system's own popup.
  static Future<void> requestAll() async {
    await Permission.locationWhenInUse.request();
    // Android 13+ lets apps save downloads without asking; older versions
    // need the storage permission.
    if (await _androidSdk() < 33) {
      await Permission.storage.request();
    }
  }

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
