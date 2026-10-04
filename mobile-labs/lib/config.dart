/// The NBC Labs employee API on the live web application. Override with
/// `--dart-define=API_BASE_URL=http://10.0.2.2:3000/api/labs` to point a debug
/// build at a local `next dev` server.
String get apiBaseUrl => const String.fromEnvironment(
  "API_BASE_URL",
  defaultValue: "https://app.nbcpedia.com/api/labs",
);

/// How often a GPS fix is taken while the employee is on duty.
const trackingInterval = Duration(minutes: 2);

/// Movement below this many metres does not produce a new fix.
const trackingDistanceFilterMeters = 30;

/// Queued fixes are uploaded at least this often.
const uploadInterval = Duration(minutes: 3);
