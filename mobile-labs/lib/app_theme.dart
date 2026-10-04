import "package:flutter/material.dart";

/// NBC Labs brand: deep indigo with an emerald accent, deliberately unlike
/// the teal NBC Pedia app so the two are never confused on one phone.
abstract final class AppTheme {
  static const ink = Color(0xFF1B1F3B);
  static const indigo = Color(0xFF3F3DBC);
  static const emerald = Color(0xFF0E9F6E);
  static const amber = Color(0xFFD97706);
  static const danger = Color(0xFFC0392B);
  static const background = Color(0xFFF5F6FB);
  static const border = Color(0xFFE1E4F0);
  static const muted = Color(0xFF636B8A);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(seedColor: indigo).copyWith(
      primary: indigo,
      onPrimary: Colors.white,
      secondary: emerald,
      surface: Colors.white,
      onSurface: ink,
      onSurfaceVariant: muted,
      outlineVariant: border,
      error: danger,
    );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    final rounded = RoundedRectangleBorder(borderRadius: BorderRadius.circular(16));
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: border),
    );

    return base.copyWith(
      scaffoldBackgroundColor: background,
      textTheme: base.textTheme.apply(bodyColor: ink, displayColor: ink).copyWith(
        headlineSmall: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: ink, letterSpacing: -0.4),
        titleLarge: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: ink),
        titleMedium: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: ink),
        bodyMedium: const TextStyle(fontSize: 14, color: ink),
        bodySmall: const TextStyle(fontSize: 12, color: muted),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: ink),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: rounded.copyWith(side: const BorderSide(color: border)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(borderSide: const BorderSide(color: indigo, width: 2)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          side: const BorderSide(color: border),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE4E3FA),
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 12,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? indigo : muted,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(color: border, space: 1),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dialogTheme: DialogThemeData(backgroundColor: Colors.white, shape: rounded),
      bottomSheetTheme: const BottomSheetThemeData(backgroundColor: Colors.white, showDragHandle: true),
    );
  }
}
