import "package:flutter/material.dart";
import "package:flutter_map/flutter_map.dart";
import "package:geolocator/geolocator.dart";
import "package:latlong2/latlong.dart";

import "../app_theme.dart";

/// Gets the phone's location, shows it on an interactive map, and returns the
/// pin that the employee confirms. Tapping the map moves the pin.
class LocationPickerEnhancedScreen extends StatefulWidget {
  final Position? initialLocation;

  const LocationPickerEnhancedScreen({super.key, this.initialLocation});

  @override
  State<LocationPickerEnhancedScreen> createState() => _LocationPickerEnhancedScreenState();
}

class _LocationPickerEnhancedScreenState extends State<LocationPickerEnhancedScreen> {
  final MapController _mapController = MapController();
  late LatLng _selected;
  bool _loading = true;
  String? _message;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialLocation;
    _selected = initial == null ? const LatLng(19.0760, 72.8777) : LatLng(initial.latitude, initial.longitude);
    _loadCurrentLocation();
  }

  Future<void> _loadCurrentLocation() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw Exception("Turn on phone location/GPS and try again.");
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) throw Exception("Location permission was denied.");
      if (permission == LocationPermission.deniedForever) {
        throw Exception("Location permission is blocked. Enable it in Android Settings.");
      }
      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      final point = LatLng(position.latitude, position.longitude);
      if (!mounted) return;
      setState(() => _selected = point);
      _mapController.move(point, 18);
    } catch (error) {
      if (mounted) setState(() => _message = error.toString().replaceFirst("Exception: ", ""));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Position _result() => Position(
        latitude: _selected.latitude,
        longitude: _selected.longitude,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
        altitudeAccuracy: 0,
        headingAccuracy: 0,
      );

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Pick up location")),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selected,
              initialZoom: 18,
              onTap: (_, point) => setState(() => _selected = point),
            ),
            children: [
              TileLayer(
                urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                userAgentPackageName: "com.nbc.labs.field",
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _selected,
                    width: 54,
                    height: 54,
                    child: const Icon(Icons.location_pin, color: Colors.red, size: 54),
                  ),
                ],
              ),
              const SimpleAttributionWidget(source: Text("OpenStreetMap contributors")),
            ],
          ),
          Positioned(
            top: 16,
            right: 16,
            child: FloatingActionButton.small(
              heroTag: "current-location",
              onPressed: _loading ? null : _loadCurrentLocation,
              child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.my_location),
            ),
          ),
          if (_message != null)
            Positioned(
              top: 16,
              left: 16,
              right: 72,
              child: Material(
                color: AppTheme.dangerSoft,
                borderRadius: BorderRadius.circular(10),
                child: Padding(padding: const EdgeInsets.all(12), child: Text(_message!)),
              ),
            ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: FilledButton.icon(
              onPressed: () => Navigator.of(context).pop(_result()),
              icon: const Icon(Icons.check),
              label: const Text("Save this location"),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            ),
          ),
        ],
      ),
    );
  }
}
