import "dart:async";
import "dart:convert";
import "dart:io";
import "dart:ui" as ui;

import "package:flutter/material.dart";
import "package:flutter/rendering.dart";
import "package:flutter_test/flutter_test.dart";
import "package:http/http.dart" as http;
import "package:http/testing.dart";
import "package:nbc_labs_field/app_theme.dart";
import "package:nbc_labs_field/screens/login_screen.dart";
import "package:nbc_labs_field/services/session_store.dart";

const _previewKey = ValueKey("login-preview");

Future<void> _showLogin(
  WidgetTester tester, {
  Size size = const Size(390, 844),
  double textScale = 1,
  Future<void> Function(Session)? onSignedIn,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    RepaintBoundary(
      key: _previewKey,
      child: MaterialApp(
        theme: AppTheme.light,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(textScaler: TextScaler.linear(textScale)),
          child: child!,
        ),
        home: LoginScreen(onSignedIn: onSignedIn ?? (_) async {}),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> _enterCredentials(WidgetTester tester) async {
  await tester.enterText(find.byType(TextFormField).first, " field.user ");
  await tester.enterText(find.byType(TextFormField).last, "secret-password");
  await tester.ensureVisible(find.byType(FilledButton));
}

void main() {
  testWidgets("empty login validates and password visibility is accessible", (
    tester,
  ) async {
    await _showLogin(tester);
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is InputDecorator &&
            widget.decoration.errorText == "Enter your login ID",
      ),
      findsOneWidget,
    );
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is InputDecorator &&
            widget.decoration.errorText == "Enter your password",
      ),
      findsOneWidget,
    );
    await tester.tap(find.byTooltip("Show password"));
    await tester.pump();
    expect(
      tester.widget<EditableText>(find.byType(EditableText).last).obscureText,
      isFalse,
    );
    expect(find.byTooltip("Hide password"), findsOneWidget);
  });

  testWidgets(
    "keyboard moves to password and small screens remain scrollable",
    (tester) async {
      await _showLogin(tester, size: const Size(320, 568), textScale: 1.5);
      await tester.ensureVisible(find.byType(TextFormField).first);
      await tester.tap(find.byType(TextFormField).first);
      await tester.enterText(find.byType(TextFormField).first, "field.user");
      await tester.testTextInput.receiveAction(TextInputAction.next);
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<EditableText>(find.byType(EditableText).last)
            .focusNode
            .hasFocus,
        isTrue,
      );
      tester.view.viewInsets = const FakeViewPadding(bottom: 240);
      addTearDown(tester.view.resetViewInsets);
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byType(FilledButton));
      await tester.pumpAndSettle();
      expect(find.byType(FilledButton).hitTestable(), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets("login sends one request while busy and passes the session", (
    tester,
  ) async {
    final response = Completer<http.Response>();
    var requestCount = 0;
    Session? signedIn;
    await http.runWithClient(
      () async {
        await _showLogin(
          tester,
          onSignedIn: (session) async => signedIn = session,
        );
        await _enterCredentials(tester);
        await tester.tap(find.byType(FilledButton));
        await tester.pump();
        expect(requestCount, 1);
        expect(
          tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
          isNull,
        );
        await tester.tap(find.byType(FilledButton));
        await tester.pump();
        expect(requestCount, 1);
        response.complete(
          http.Response(
            jsonEncode({
              "token": "test-token",
              "employee": {
                "id": "E1",
                "username": "field.user",
                "name": "Field User",
              },
            }),
            200,
          ),
        );
        await tester.pumpAndSettle();
        expect(signedIn?.username, "field.user");
        expect(signedIn?.employeeId, "E1");
      },
      () => MockClient((request) {
        requestCount++;
        expect(request.url.path, endsWith("/auth/login"));
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body["username"], "field.user");
        expect(body["password"], "secret-password");
        return response.future;
      }),
    );
  });

  testWidgets("server errors are shown and an unmounted login is safe", (
    tester,
  ) async {
    await http.runWithClient(
      () async {
        await _showLogin(tester);
        await _enterCredentials(tester);
        await tester.tap(find.byType(FilledButton));
        await tester.pumpAndSettle();
        expect(find.text("Login ID or password is incorrect."), findsOneWidget);
        expect(
          tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
          isNotNull,
        );
      },
      () => MockClient(
        (_) async => http.Response(
          '{"error":"Login ID or password is incorrect."}',
          401,
        ),
      ),
    );

    final response = Completer<http.Response>();
    await http.runWithClient(() async {
      await _showLogin(tester);
      await _enterCredentials(tester);
      await tester.tap(find.byType(FilledButton));
      await tester.pump();
      await tester.pumpWidget(const SizedBox());
      response.complete(http.Response('{"error":"Try again."}', 500));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    }, () => MockClient((_) => response.future));
  });

  testWidgets("login preview renders", (tester) async {
    await _showLogin(tester);
    final boundary = tester.renderObject<RenderRepaintBoundary>(
      find.byKey(_previewKey),
    );
    await tester.runAsync(() async {
      final image = await boundary.toImage(pixelRatio: 2);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      final file = File("build/previews/login.png");
      await file.parent.create(recursive: true);
      await file.writeAsBytes(bytes!.buffer.asUint8List());
      image.dispose();
    });
    expect(tester.takeException(), isNull);
  });
}
