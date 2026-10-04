import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  final _loader = GlobalKey<LoadViewState<(List<Json>, List<Json>)>>();
  List<Json> _balance = const [];

  Future<(List<Json>, List<Json>)> _load() async {
    final results = await Future.wait([
      ApiClient.instance.get("/leave-balance"),
      ApiClient.instance.list("/leaves"),
    ]);
    final balance = (((results[0] as Json)["items"] as List?) ?? const []).cast<Json>();
    _balance = balance;
    return (balance, results[1] as List<Json>);
  }

  Future<void> _apply() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ApplyLeaveScreen(balance: _balance)),
    );
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Leave")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _apply,
        icon: const Icon(Icons.add_rounded),
        label: const Text("Apply leave"),
      ),
      body: LoadView<(List<Json>, List<Json>)>(
        key: _loader,
        load: _load,
        builder: (context, data) {
          final (balance, leaves) = data;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
            children: [
              if (balance.isNotEmpty) ...[
                const SectionLabel("Balance this year"),
                SizedBox(
                  height: 104,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: balance.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, i) {
                      final b = balance[i];
                      return Container(
                        width: 150,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: AppTheme.border),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(str(b["leaveType"]), maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
                            const SizedBox(height: 4),
                            Text("${b["available"]}", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.indigo)),
                            Text("of ${b["entitled"]} · ${b["used"]} used", style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
              const SectionLabel("Applications"),
              if (leaves.isEmpty)
                const EmptyState(icon: Icons.beach_access_rounded, message: "No leave applied yet.")
              else
                for (final leave in leaves) ...[
                  RecordTile(
                    title: str(leave["leaveType"]).isEmpty ? "Leave" : str(leave["leaveType"]),
                    subtitle: leave["fromDate"] == leave["toDate"]
                        ? fmtDate(leave["fromDate"])
                        : "${fmtDate(leave["fromDate"])} – ${fmtDate(leave["toDate"])}",
                    meta: [
                      "${leave["days"] ?? 1} day${leave["days"] == 1 ? "" : "s"}",
                      str(leave["reason"]),
                      if (str(leave["reviewedBy"]).isNotEmpty) "by ${leave["reviewedBy"]}",
                    ].where((s) => s.isNotEmpty).join(" · "),
                    status: str(leave["status"]),
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

class ApplyLeaveScreen extends StatefulWidget {
  final List<Json> balance;
  const ApplyLeaveScreen({super.key, required this.balance});

  @override
  State<ApplyLeaveScreen> createState() => _ApplyLeaveScreenState();
}

class _ApplyLeaveScreenState extends State<ApplyLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  String _type = "";
  String _reason = "";
  String _from = todayKey();
  String _to = todayKey();
  bool _halfDay = false;
  List<String> _reasons = [];
  bool _saving = false;

  List<String> get _types {
    final fromBalance = widget.balance.map((b) => str(b["leaveType"])).where((s) => s.isNotEmpty).toList();
    return fromBalance.isNotEmpty ? fromBalance : const ["Casual Leave", "Sick Leave", "Privilege Leave", "Leave Without Pay"];
  }

  int get _days {
    final from = DateTime.tryParse(_from);
    final to = DateTime.tryParse(_to);
    if (from == null || to == null || to.isBefore(from)) return 0;
    return to.difference(from).inDays + 1;
  }

  @override
  void initState() {
    super.initState();
    ApiClient.instance.masters(["leave-reason"]).then((m) {
      if (mounted) setState(() => _reasons = m["leave-reason"]!);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_days == 0) {
      showMessage(context, "The leave must end on or after the day it starts.");
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post("/leaves", {
        "leaveType": _type,
        "reason": _reason,
        "fromDate": _from,
        "toDate": _to,
        "days": _halfDay && _days == 1 ? 0.5 : _days,
      });
      if (!mounted) return;
      showMessage(context, "Leave applied. You'll see the status here once it's reviewed.");
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final available = widget.balance.where((b) => b["leaveType"] == _type).map((b) => b["available"]).firstOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text("Apply leave")),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            PickerField(label: "Leave type", value: _type, options: _types, required: true, onChanged: (v) => setState(() => _type = v)),
            if (available != null)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 4),
                child: Text("$available day(s) available", style: Theme.of(context).textTheme.bodySmall),
              ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DateField(
                    label: "From",
                    value: _from,
                    onChanged: (v) => setState(() {
                      _from = v;
                      if ((DateTime.tryParse(_to) ?? DateTime(0)).isBefore(DateTime.parse(v))) _to = v;
                    }),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: DateField(label: "To", value: _to, onChanged: (v) => setState(() => _to = v))),
              ],
            ),
            if (_days == 1)
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text("Half day"),
                value: _halfDay,
                onChanged: (v) => setState(() => _halfDay = v),
              ),
            const SizedBox(height: 12),
            PickerField(label: "Reason", value: _reason, options: _reasons, required: true, onChanged: (v) => setState(() => _reason = v)),
            const SizedBox(height: 16),
            Text(
              _days == 0 ? "Check the dates" : "${_halfDay && _days == 1 ? "0.5" : _days} day(s)",
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            BusyButton(label: "Submit for approval", busy: _saving, onPressed: _save, icon: Icons.send_rounded),
          ],
        ),
      ),
    );
  }
}
