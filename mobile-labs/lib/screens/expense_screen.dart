import "package:flutter/material.dart";

import "../services/api_client.dart";
import "../widgets/common.dart";

num _amount(Json e) => ((e["fare"] as num?) ?? 0) + ((e["otherAmount"] as num?) ?? 0);

class ExpenseScreen extends StatefulWidget {
  const ExpenseScreen({super.key});

  @override
  State<ExpenseScreen> createState() => _ExpenseScreenState();
}

class _ExpenseScreenState extends State<ExpenseScreen> {
  final _loader = GlobalKey<LoadViewState<List<Json>>>();

  Future<void> _add() async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const NewExpenseScreen()));
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Expenses")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add_rounded),
        label: const Text("New claim"),
      ),
      body: LoadView<List<Json>>(
        key: _loader,
        load: () => ApiClient.instance.list("/expenses"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.receipt_long_rounded, message: "No expense claims yet.")]);
          }
          final month = todayKey().substring(0, 7);
          final thisMonth = items.where((e) => str(e["expenseDate"]).startsWith(month));
          final pending = thisMonth.where((e) => e["status"] == "pending").fold<num>(0, (s, e) => s + _amount(e));
          final approved = thisMonth.where((e) => e["status"] == "approved").fold<num>(0, (s, e) => s + _amount(e));

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(child: _Figure("Approved this month", fmtRupees(approved))),
                      Expanded(child: _Figure("Pending", fmtRupees(pending))),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              for (final e in items) ...[
                RecordTile(
                  title: "${str(e["head"]).isEmpty ? "Expense" : e["head"]} · ${fmtRupees(_amount(e))}",
                  subtitle: [
                    if (str(e["fromCity"]).isNotEmpty || str(e["toCity"]).isNotEmpty) "${e["fromCity"] ?? ""} → ${e["toCity"] ?? ""}",
                    str(e["modeOfTravel"]),
                    if (e["distanceKm"] != null) "${e["distanceKm"]} km",
                  ].where((s) => s.isNotEmpty).join(" · "),
                  meta: [fmtDate(e["expenseDate"]), str(e["remarks"])].where((s) => s.isNotEmpty).join(" · "),
                  status: str(e["status"]),
                ),
                const SizedBox(height: 8),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  final String label;
  final String value;
  const _Figure(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class NewExpenseScreen extends StatefulWidget {
  const NewExpenseScreen({super.key});

  @override
  State<NewExpenseScreen> createState() => _NewExpenseScreenState();
}

class _NewExpenseScreenState extends State<NewExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  String _date = todayKey();
  String _head = "";
  String _mode = "";
  final _from = TextEditingController();
  final _to = TextEditingController();
  final _km = TextEditingController();
  final _fare = TextEditingController();
  final _other = TextEditingController();
  final _remarks = TextEditingController();
  Map<String, List<String>> _masters = {};
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    ApiClient.instance.masters(["expense-head", "mode-of-travel"]).then((m) {
      if (mounted) setState(() => _masters = m);
    });
  }

  @override
  void dispose() {
    for (final c in [_from, _to, _km, _fare, _other, _remarks]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final fare = double.tryParse(_fare.text) ?? 0;
    final other = double.tryParse(_other.text) ?? 0;
    if (fare + other <= 0) {
      showMessage(context, "Enter the fare or another amount.");
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post("/expenses", {
        "expenseDate": _date,
        "head": _head,
        "modeOfTravel": _mode,
        "fromCity": _from.text.trim(),
        "toCity": _to.text.trim(),
        "distanceKm": double.tryParse(_km.text),
        "fare": fare,
        "otherAmount": other,
        "remarks": _remarks.text.trim(),
      });
      if (!mounted) return;
      showMessage(context, "Claim submitted for approval.");
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 12);
    const number = TextInputType.numberWithOptions(decimal: true);
    return Scaffold(
      appBar: AppBar(title: const Text("New expense claim")),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DateField(label: "Date", value: _date, lastDate: DateTime.now(), onChanged: (v) => setState(() => _date = v)),
            gap,
            PickerField(
              label: "Expense head",
              value: _head,
              options: _masters["expense-head"]?.isNotEmpty == true
                  ? _masters["expense-head"]!
                  : const ["Travel", "Daily allowance", "Food", "Lodging", "Phone", "Other"],
              required: true,
              onChanged: (v) => setState(() => _head = v),
            ),
            gap,
            PickerField(
              label: "Mode of travel",
              value: _mode,
              options: _masters["mode-of-travel"]?.isNotEmpty == true
                  ? _masters["mode-of-travel"]!
                  : const ["Bike", "Car", "Bus", "Train", "Auto", "Walk"],
              onChanged: (v) => setState(() => _mode = v),
            ),
            gap,
            Row(
              children: [
                Expanded(child: TextFormField(controller: _from, decoration: const InputDecoration(labelText: "From city"))),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _to, decoration: const InputDecoration(labelText: "To city"))),
              ],
            ),
            gap,
            TextFormField(controller: _km, keyboardType: number, decoration: const InputDecoration(labelText: "Distance (km)")),
            gap,
            Row(
              children: [
                Expanded(child: TextFormField(controller: _fare, keyboardType: number, decoration: const InputDecoration(labelText: "Fare (₹)"))),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _other, keyboardType: number, decoration: const InputDecoration(labelText: "Other (₹)"))),
              ],
            ),
            gap,
            TextFormField(controller: _remarks, maxLines: 2, decoration: const InputDecoration(labelText: "Remarks")),
            const SizedBox(height: 20),
            BusyButton(label: "Submit claim", busy: _saving, onPressed: _save, icon: Icons.send_rounded),
          ],
        ),
      ),
    );
  }
}
