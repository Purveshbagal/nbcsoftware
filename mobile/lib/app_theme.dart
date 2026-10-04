import "package:flutter/material.dart";

abstract final class AppTheme {
  static const navy = Color(0xFF122B40);
  static const teal = Color(0xFF087F82);
  static const mint = Color(0xFF72DDD0);
  static const background = Color(0xFFF4F7FA);
  static const border = Color(0xFFDCE5ED);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(seedColor: teal).copyWith(
      primary: teal,
      onPrimary: Colors.white,
      secondary: navy,
      surface: Colors.white,
      onSurface: navy,
      onSurfaceVariant: const Color(0xFF5D7082),
      outlineVariant: border,
      error: const Color(0xFFBE3144),
    );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    );
    return base.copyWith(
      scaffoldBackgroundColor: background,
      textTheme: base.textTheme.copyWith(
        bodyLarge: const TextStyle(fontSize: 14, color: Colors.black),
        bodyMedium: const TextStyle(fontSize: 13, color: Colors.black),
        bodySmall: const TextStyle(fontSize: 11, color: Colors.black),
        labelLarge: const TextStyle(fontSize: 13, color: Colors.black),
        titleSmall: const TextStyle(fontSize: 13, color: Colors.black),
        headlineMedium: const TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          color: navy,
          letterSpacing: -0.8,
        ),
        headlineSmall: const TextStyle(
          fontSize: 23,
          fontWeight: FontWeight.w700,
          color: navy,
          letterSpacing: -0.6,
        ),
        titleLarge: const TextStyle(
          fontSize: 19,
          fontWeight: FontWeight.w700,
          color: navy,
        ),
        titleMedium: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: navy,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        foregroundColor: navy,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: navy,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: shape.copyWith(side: const BorderSide(color: border)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 18,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: teal, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: shape,
          side: const BorderSide(color: border),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFDDF3EF),
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? teal
                : const Color(0xFF5D7082),
          ),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      dividerTheme: const DividerThemeData(color: border, space: 24),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: navy,
        behavior: SnackBarBehavior.floating,
        shape: shape,
      ),
      dialogTheme: DialogThemeData(backgroundColor: Colors.white, shape: shape),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        showDragHandle: true,
      ),
    );
  }
}
