/// The NBC Labs employee API on the live web application. Override with
/// `--dart-define=API_BASE_URL=http://10.0.2.2:3000/api/labs` to point a debug
/// build at a local `next dev` server.
String get apiBaseUrl => const String.fromEnvironment(
  "API_BASE_URL",
  defaultValue: "https://work.nbcpedia.com/api/labs",
);

/// How often a GPS fix is taken while the employee is on duty. Close enough
/// together that the route drawn on the admin map follows the roads.
const trackingInterval = Duration(seconds: 30);

/// Movement below this many metres does not produce a new fix, so standing
/// still costs no battery.
const trackingDistanceFilterMeters = 15;

/// Queued fixes are uploaded at least this often.
const uploadInterval = Duration(minutes: 1);
