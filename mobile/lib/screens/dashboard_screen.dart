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

  const _DashboardStats({
    required this.totalRegistrations,
    required this.pendingApprovals,
    required this.approvedRegistrations,
    required this.pendingPayments,
    required this.spentAmount,
    required this.spentCount,
    required this.owedAmount,
    required this.owedCount,
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

    return _DashboardStats(
      totalRegistrations: registrations.length,
      pendingApprovals: registrations
          .where((r) => r.status == "pending")
          .length,
      approvedRegistrations: registrations
          .where((r) => r.status == "approved")
          .length,
      pendingPayments: payments.where((p) => p.status == "pending").length,
      spentAmount: spent.fold<num>(0, (sum, p) => sum + p.payableAmount),
      spentCount: spent.length,
      owedAmount: owed.fold<num>(0, (sum, p) => sum + p.payableAmount),
      owedCount: owed.length,
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
        builder: (_) =>
            PaymentLedgerScreen(apiClient: widget.apiClient, kind: kind),
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
                    Icon(
                      Icons.wb_sunny_outlined,
                      color: AppTheme.mint,
                      size: 18,
                    ),
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
                  "A little clarity for a productive day. Track your registrations and payments here.",
                  style: TextStyle(color: Color(0xFFCBDDE7), height: 1.6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text("Your activity", style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          const Text(
            "Pull down to refresh your latest updates.",
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
                  const SizedBox(height: 12),
                  LayoutBuilder(
                    builder: (context, constraints) => GridView(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount:
                            constraints.maxWidth < 340 ||
                                MediaQuery.textScalerOf(context).scale(14) > 20
                            ? 1
                            : 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        mainAxisExtent:
                            180 +
                            (MediaQuery.textScalerOf(context).scale(14) - 14) *
                                4,
                      ),
                      children: [
                        _StatCard(
                          label: "My Registrations",
                          value: stats.totalRegistrations,
                          icon: Icons.person_add_alt,
                        ),
                        _StatCard(
                          label: "Pending Approvals",
                          value: stats.pendingApprovals,
                          icon: Icons.hourglass_top,
                        ),
                        _StatCard(
                          label: "Approved",
                          value: stats.approvedRegistrations,
                          icon: Icons.verified,
                        ),
                        _StatCard(
                          label: "Requests in Review",
                          value: stats.pendingPayments,
                          icon: Icons.request_page,
                        ),
                      ],
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

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 22,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            Text("$value", style: Theme.of(context).textTheme.headlineMedium),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

/// A rupee total that opens its payment history when tapped.
class _MoneyCard extends StatelessWidget {
  final String label;
  final num amount;
  final String detail;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _MoneyCard({
    required this.label,
    required this.amount,
    required this.detail,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, size: 20, color: color),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chevron_right,
                    size: 20,
                    color: theme.colorScheme.outline,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                formatRupees(amount),
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(label, style: theme.textTheme.titleSmall),
              const SizedBox(height: 2),
              Text(detail, style: theme.textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}
