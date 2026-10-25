import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../services/session_store.dart";
import "payment_ledger_screen.dart";

class DashboardScreen extends StatefulWidget {
  final ApiClient apiClient;
  final Session session;

  const DashboardScreen({
    super.key,
    required this.apiClient,
    required this.session,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardStats {
  final int totalRegistrations;
  final int pendingApprovals;
  final int approvedRegistrations;
  final int pendingPayments;
  final num spentAmount;
  final int spentCount;
  final num owedAmount;
  final int owedCount;
  final num budgetTotalLimit;
  final num budgetSpent;
  final num budgetAvailable;

  const _DashboardStats({
    required this.totalRegistrations,
    required this.pendingApprovals,
    required this.approvedRegistrations,
    required this.pendingPayments,
    required this.spentAmount,
    required this.spentCount,
    required this.owedAmount,
    required this.owedCount,
    required this.budgetTotalLimit,
    required this.budgetSpent,
    required this.budgetAvailable,
  });
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<_DashboardStats> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_DashboardStats> _load() async {
    final registrations = await widget.apiClient.fetchRegistrations();
    final payments = await widget.apiClient.fetchPayments();
    final spent = payments.where((p) => p.handedOverToDoctor);
    final owed = payments.where((p) => p.owedToDoctor);

    // Fetch budget data from new analytics endpoint
    num budgetTotal = 0;
    num budgetSpent = 0;
    num budgetAvailable = 0;

    try {
      final budgetData = await widget.apiClient.fetchBudgetAnalytics();
      budgetTotal = budgetData["totalLimit"] ?? 0;
      budgetSpent = budgetData["spentAmount"] ?? 0;
      budgetAvailable = budgetData["availableAmount"] ?? 0;
    } catch (e) {
      // Budget not set or error
      print("Budget fetch error: $e");
    }

    return _DashboardStats(
      totalRegistrations: registrations.length,
      pendingApprovals: registrations.where((r) => r.status == "pending").length,
      approvedRegistrations: registrations.where((r) => r.status == "approved").length,
      pendingPayments: payments.where((p) => p.status == "pending").length,
      spentAmount: spent.fold<num>(0, (sum, p) => sum + p.payableAmount),
      spentCount: spent.length,
      owedAmount: owed.fold<num>(0, (sum, p) => sum + p.payableAmount),
      owedCount: owed.length,
      budgetTotalLimit: budgetTotal,
      budgetSpent: budgetSpent,
      budgetAvailable: budgetAvailable,
    );
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() {
      _future = next;
    });
    try {
      await next;
    } catch (_) {
      // The FutureBuilder renders the failure and retry action.
    }
  }

  Future<void> _openLedger(LedgerKind kind) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PaymentLedgerScreen(apiClient: widget.apiClient, kind: kind),
      ),
    );
    if (mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.navy,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.wb_sunny_outlined, color: AppTheme.mint, size: 18),
                    SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        "YOUR FIELD WORKSPACE",
                        style: TextStyle(
                          color: AppTheme.mint,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  "Welcome, ${widget.session.name}",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  "Track your budget, registrations and payments here.",
                  style: TextStyle(color: Color(0xFFCBDDE7), height: 1.6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text("Your Budget", style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          const Text(
            "Your allocated budget and spending status.",
            style: TextStyle(color: Color(0xFF5D7082), fontSize: 12),
          ),
          const SizedBox(height: 18),
          FutureBuilder<_DashboardStats>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(
                    children: [
                      const Icon(Icons.cloud_off_outlined, size: 32),
                      const SizedBox(height: 12),
                      const Text("Unable to load your activity."),
                      const SizedBox(height: 8),
                      const Text("Check your connection and try again."),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _refresh,
                        icon: const Icon(Icons.refresh),
                        label: const Text("Try again"),
                      ),
                    ],
                  ),
                );
              }

              final stats = snapshot.data!;
              final narrow = MediaQuery.textScalerOf(context).scale(14) > 20;

              // Budget Cards
              final budgetCards = [
                _BudgetCard(
                  label: "Available Budget",
                  amount: stats.budgetAvailable,
                  icon: Icons.account_balance_wallet,
                  color: Colors.green.shade600,
                ),
                _BudgetCard(
                  label: "Spent Budget",
                  amount: stats.budgetSpent,
                  icon: Icons.trending_down,
                  color: Colors.orange.shade600,
                ),
                _BudgetCard(
                  label: "Total Limit",
                  amount: stats.budgetTotalLimit,
                  icon: Icons.savings,
                  color: Colors.blue.shade600,
                ),
              ];

              final paymentCards = [
                _MoneyCard(
                  label: "Total Spend",
                  amount: stats.spentAmount,
                  detail: "${stats.spentCount} given to doctors",
                  icon: Icons.payments_outlined,
                  color: AppTheme.teal,
                  onTap: () => _openLedger(LedgerKind.paid),
                ),
                _MoneyCard(
                  label: "Pending Payments",
                  amount: stats.owedAmount,
                  detail: "${stats.owedCount} still to give",
                  icon: Icons.hourglass_top,
                  color: const Color(0xFF97600C),
                  onTap: () => _openLedger(LedgerKind.pending),
                ),
              ];

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Budget Cards Row
                  LayoutBuilder(
                    builder: (context, constraints) =>
                        constraints.maxWidth < 500 || narrow
                            ? Column(
                                children: [
                                  budgetCards[0],
                                  const SizedBox(height: 12),
                                  budgetCards[1],
                                  const SizedBox(height: 12),
                                  budgetCards[2],
                                ],
                              )
                            : IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Expanded(child: budgetCards[0]),
                                    const SizedBox(width: 12),
                                    Expanded(child: budgetCards[1]),
                                    const SizedBox(width: 12),
                                    Expanded(child: budgetCards[2]),
                                  ],
                                ),
                              ),
                  ),
                  const SizedBox(height: 28),
                  Text("Your Activity", style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 6),
                  const Text(
                    "Pull down to refresh your latest updates.",
                    style: TextStyle(color: Color(0xFF5D7082), fontSize: 12),
                  ),
                  const SizedBox(height: 18),

                  // Payment Cards
                  LayoutBuilder(
                    builder: (context, constraints) =>
                        constraints.maxWidth < 340 || narrow
                            ? Column(
                                children: [
                                  paymentCards[0],
                                  const SizedBox(height: 12),
                                  paymentCards[1],
                                ],
                              )
                            : IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Expanded(child: paymentCards[0]),
                                    const SizedBox(width: 12),
                                    Expanded(child: paymentCards[1]),
                                  ],
                                ),
                              ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _BudgetCard extends StatelessWidget {
  final String label;
  final num amount;
  final IconData icon;
  final Color color;

  const _BudgetCard({
    required this.label,
    required this.amount,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const Spacer(),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF5D7082),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "₹${amount.toStringAsFixed(0)}",
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MoneyCard extends StatelessWidget {
  final String label;
  final num amount;
  final String detail;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _MoneyCard({
    required this.label,
    required this.amount,
    required this.detail,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: color, size: 24),
                  ),
                  const Spacer(),
                  Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF5D7082),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "₹${amount.toStringAsFixed(0)}",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                detail,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF5D7082),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
