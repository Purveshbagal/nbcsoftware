import "package:flutter/material.dart";
import "package:flutter/services.dart";

/// Shared visual language for the NBC Labs field workspace: a deep petrol
/// navy brand with a clinical teal accent, set in Inter at compact sizes.
abstract final class AppTheme {
  static const fontFamily = "Inter";

  static const ink = Color(0xFF0F1F2E);
  static const navy = Color(0xFF0B2A3C);
  static const navyLight = Color(0xFF134B63);
  static const indigo = Color(0xFF0E7490);
  static const emerald = Color(0xFF0F8A6A);
  static const amber = Color(0xFFB26B00);
  static const danger = Color(0xFFC53030);
  static const background = Color(0xFFF3F6F9);
  static const border = Color(0xFFE2E8EE);
  static const muted = Color(0xFF5B6B7B);
  static const primarySoft = Color(0xFFE5F3F6);
  static const emeraldSoft = Color(0xFFE5F5EF);
  static const amberSoft = Color(0xFFFDF3E1);
  static const dangerSoft = Color(0xFFFCEBEA);
  static const surfaceMuted = Color(0xFFF8FAFC);

  /// Text and accents placed on the navy brand surfaces.
  static const onNavyMuted = Color(0xFFB7CBD8);
  static const onNavySubtle = Color(0xFF8FAABC);
  static const mint = Color(0xFF5FE0C2);

  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [navy, navyLight],
  );

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(seedColor: indigo).copyWith(
      primary: indigo, onPrimary: Colors.white,
      primaryContainer: primarySoft, onPrimaryContainer: indigo,
      secondary: emerald, onSecondary: Colors.white,
      secondaryContainer: emeraldSoft, onSecondaryContainer: emerald,
      surface: Colors.white, surfaceContainerLowest: Colors.white,
      surfaceContainerLow: surfaceMuted, surfaceContainer: background,
      surfaceContainerHigh: primarySoft, surfaceContainerHighest: border,
      onSurface: ink, onSurfaceVariant: muted,
      outline: muted, outlineVariant: border,
      error: danger, onError: Colors.white,
      errorContainer: dangerSoft, onErrorContainer: danger,
      surfaceTint: Colors.transparent,
    );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: fontFamily);
    final rounded = RoundedRectangleBorder(borderRadius: BorderRadius.circular(14));
    final controlShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(10));
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: border),
    );
    final text = base.textTheme.apply(bodyColor: ink, displayColor: ink, fontFamily: fontFamily).copyWith(
      displaySmall: const TextStyle(fontSize: 26, height: 1.2, fontWeight: FontWeight.w700, color: ink, letterSpacing: -0.8),
      headlineLarge: const TextStyle(fontSize: 23, height: 1.25, fontWeight: FontWeight.w700, color: ink, letterSpacing: -0.6),
      headlineMedium: const TextStyle(fontSize: 21, height: 1.25, fontWeight: FontWeight.w700, color: ink, letterSpacing: -0.5),
      headlineSmall: const TextStyle(fontSize: 19, height: 1.3, fontWeight: FontWeight.w700, color: ink, letterSpacing: -0.4),
      titleLarge: const TextStyle(fontSize: 16, height: 1.35, fontWeight: FontWeight.w600, color: ink, letterSpacing: -0.2),
      titleMedium: const TextStyle(fontSize: 13.5, height: 1.4, fontWeight: FontWeight.w600, color: ink, letterSpacing: -0.1),
      titleSmall: const TextStyle(fontSize: 12.5, height: 1.4, fontWeight: FontWeight.w600, color: ink),
      bodyLarge: const TextStyle(fontSize: 13.5, height: 1.5, color: ink),
      bodyMedium: const TextStyle(fontSize: 12.5, height: 1.5, color: ink),
      bodySmall: const TextStyle(fontSize: 11.5, height: 1.45, color: muted),
      labelLarge: const TextStyle(fontSize: 13, height: 1.3, fontWeight: FontWeight.w600, color: ink),
      labelMedium: const TextStyle(fontSize: 11.5, height: 1.3, fontWeight: FontWeight.w500, color: muted),
      labelSmall: const TextStyle(fontSize: 10.5, height: 1.3, fontWeight: FontWeight.w600, color: muted, letterSpacing: 0.3),
    );
    return base.copyWith(
      scaffoldBackgroundColor: background,
      textTheme: text,
      iconTheme: const IconThemeData(size: 20, color: muted),
      appBarTheme: AppBarTheme(
        backgroundColor: background, foregroundColor: ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0, scrolledUnderElevation: 0, centerTitle: false,
        titleSpacing: 16, toolbarHeight: 56, titleTextStyle: text.titleLarge,
        iconTheme: const IconThemeData(color: ink, size: 21),
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent, statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light, systemNavigationBarColor: Colors.white,
          systemNavigationBarIconBrightness: Brightness.dark,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white, surfaceTintColor: Colors.transparent,
        elevation: 0, margin: EdgeInsets.zero,
        shape: rounded.copyWith(side: const BorderSide(color: border)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        labelStyle: text.bodyMedium?.copyWith(color: muted),
        hintStyle: text.bodyMedium?.copyWith(color: muted.withValues(alpha: 0.7)),
        floatingLabelStyle: text.labelMedium?.copyWith(color: indigo, fontWeight: FontWeight.w600),
        errorStyle: text.bodySmall?.copyWith(color: danger), errorMaxLines: 3,
        prefixIconColor: muted, suffixIconColor: muted,
        border: inputBorder, enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(borderSide: const BorderSide(color: indigo, width: 1.4)),
        errorBorder: inputBorder.copyWith(borderSide: const BorderSide(color: danger)),
        focusedErrorBorder: inputBorder.copyWith(borderSide: const BorderSide(color: danger, width: 1.4)),
      ),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
        minimumSize: const Size(48, 46), padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: controlShape, textStyle: text.labelLarge,
      )),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 44), padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: controlShape, side: const BorderSide(color: border), textStyle: text.labelLarge,
      )),
      textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(
        minimumSize: const Size(48, 44), textStyle: text.labelLarge, shape: controlShape,
      )),
      iconButtonTheme: IconButtonThemeData(style: IconButton.styleFrom(
        minimumSize: const Size(44, 44), iconSize: 20,
      )),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: indigo, foregroundColor: Colors.white,
        elevation: 2, highlightElevation: 3,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        extendedTextStyle: text.labelLarge,
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 64, backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
        indicatorColor: primarySoft, elevation: 0,
        indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
          size: 21, color: states.contains(WidgetState.selected) ? indigo : muted,
        )),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
          fontFamily: fontFamily, fontSize: 10.5, height: 1.3,
          fontWeight: states.contains(WidgetState.selected) ? FontWeight.w600 : FontWeight.w500,
          color: states.contains(WidgetState.selected) ? indigo : muted,
        )),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size(48, 40)),
        textStyle: WidgetStatePropertyAll(text.labelMedium),
        side: const WidgetStatePropertyAll(BorderSide(color: border)),
        shape: WidgetStatePropertyAll(controlShape),
        backgroundColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? primarySoft : Colors.white),
        foregroundColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? indigo : muted),
      )),
      listTileTheme: ListTileThemeData(
        iconColor: muted, titleTextStyle: text.titleMedium, subtitleTextStyle: text.bodySmall,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2), shape: controlShape,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceMuted, selectedColor: primarySoft, labelStyle: text.labelMedium,
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      tabBarTheme: TabBarThemeData(
        labelStyle: text.labelLarge, unselectedLabelStyle: text.labelLarge,
        labelColor: indigo, unselectedLabelColor: muted, dividerColor: border,
        indicatorColor: indigo,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: indigo, linearTrackColor: primarySoft),
      dividerTheme: const DividerThemeData(color: border, space: 1),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: navy, contentTextStyle: text.bodyMedium?.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating, shape: controlShape,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
        titleTextStyle: text.titleLarge, contentTextStyle: text.bodyMedium?.copyWith(color: muted), shape: rounded,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
        showDragHandle: true, dragHandleColor: border,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      ),
    );
  }
}
