/// Defaults to the live NBC Pedia API. Override with --dart-define=API_BASE_URL
/// when building for a separate development or staging backend.
String get apiBaseUrl => const String.fromEnvironment(
  "API_BASE_URL",
  defaultValue: "https://app.nbcpedia.com/api",
);
