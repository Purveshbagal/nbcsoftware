import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nbc_pedia_field/app_theme.dart';
import 'package:nbc_pedia_field/models/payment.dart';
import 'package:nbc_pedia_field/screens/give_payment_screen.dart';
import 'package:nbc_pedia_field/services/api_client.dart';

class EmptyPaymentsApi extends ApiClient {
  @override
  Future<List<Payment>> fetchReadyForPayment() async => [];
  @override
  Future<List<Payment>> fetchPayments() async => [];
}

void main() {
  testWidgets('Typed input is black on the light surface', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: TextField()),
      ),
    );
    await tester.enterText(find.byType(TextField), 'Visible input');
    final input = tester.widget<EditableText>(find.byType(EditableText));
    expect(input.style.color, Colors.black);
  });

  testWidgets('Empty payment dropdown fits a narrow screen with large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 800);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 1.5;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(body: GivePaymentScreen(apiClient: EmptyPaymentsApi())),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('No payments ready'), findsOneWidget);
    final context = tester.element(find.text('Payment History'));
    expect(Theme.of(context).textTheme.titleSmall?.color, Colors.black);
    await tester.pumpWidget(const SizedBox());
  });
}
