import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:shared_preferences/shared_preferences.dart";

import "package:nbc_pedia_field/main.dart";

void main() {
  Future<void> openLogin(WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const NbcPediaFieldApp());
    await tester.pumpAndSettle();
  }

  testWidgets("App boots to the login screen when logged out", (tester) async {
    await openLogin(tester);
    expect(find.text("NBC Pedia"), findsOneWidget);
    expect(find.widgetWithText(TextFormField, "Username"), findsOneWidget);
  });

  testWidgets("Login validates required fields before making a request", (
    tester,
  ) async {
    await openLogin(tester);
    final submit = find.widgetWithText(FilledButton, "Sign in to workspace");
    await tester.ensureVisible(submit);
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(find.text("Enter your username"), findsOneWidget);
    expect(find.text("Enter your password"), findsOneWidget);
  });

  testWidgets("Password visibility can be toggled without losing the value", (
    tester,
  ) async {
    await openLogin(tester);
    final password = find.widgetWithText(TextFormField, "Password");
    await tester.enterText(password, "test-password");
    expect(
      tester.widget<EditableText>(find.byType(EditableText).last).obscureText,
      isTrue,
    );
    await tester.ensureVisible(find.byTooltip("Show password"));
    await tester.tap(find.byTooltip("Show password"));
    await tester.pump();
    final field = tester.widget<EditableText>(find.byType(EditableText).last);
    expect(field.obscureText, isFalse);
    expect(field.controller.text, "test-password");
  });

  testWidgets("Login remains scrollable on a small screen with large text", (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await openLogin(tester);
    await tester.ensureVisible(
      find.widgetWithText(FilledButton, "Sign in to workspace"),
    );
    expect(tester.takeException(), isNull);
  });
}
