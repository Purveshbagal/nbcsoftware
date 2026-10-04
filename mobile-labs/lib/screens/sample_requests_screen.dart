import "package:flutter/material.dart";

import "../services/api_client.dart";
import "../widgets/common.dart";

/// Ask the office for product samples or promotional gifts.
class SampleRequestsScreen extends StatefulWidget {
  const SampleRequestsScreen({super.key});

  @override
  State<SampleRequestsScreen> createState() => _SampleRequestsScreenState();
}

class _SampleRequestsScreenState extends State<SampleRequestsScreen> {
  final _loader = GlobalKey<LoadViewState<List<Json>>>();

  Future<void> _add() async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _NewRequestSheet(),
    );
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Samples & gifts")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add_rounded),
        label: const Text("Request"),
      ),
      body: LoadView<List<Json>>(
        key: _loader,
        load: () => ApiClient.instance.list("/sample-requests"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.medication_rounded, message: "No requests yet.")]);
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final r = items[i];
              return RecordTile(
                title: "${r["item"]} × ${r["quantity"]}",
                subtitle: r["itemType"] == "gift" ? "Promotional gift" : "Product sample",
                meta: [str(r["requestNo"]), fmtDate(r["requestDate"]), str(r["remarks"])].where((s) => s.isNotEmpty).join(" · "),
                status: str(r["status"]),
              );
            },
          );
        },
      ),
    );
  }
}

class _NewRequestSheet extends StatefulWidget {
  const _NewRequestSheet();

  @override
  State<_NewRequestSheet> createState() => _NewRequestSheetState();
}

class _NewRequestSheetState extends State<_NewRequestSheet> {
  final _formKey = GlobalKey<FormState>();
  String _type = "sample";
  String _item = "";
  final _qty = TextEditingController();
  final _remarks = TextEditingController();
  Map<String, List<String>> _masters = {};
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    ApiClient.instance.masters(["product-sample", "promotional-gift"]).then((m) {
      if (mounted) setState(() => _masters = m);
    });
  }

  @override
  void dispose() {
    _qty.dispose();
    _remarks.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post("/sample-requests", {
        "requestDate": todayKey(),
        "itemType": _type,
        "item": _item,
        "quantity": int.tryParse(_qty.text) ?? 0,
        "remarks": _remarks.text.trim(),
      });
      if (!mounted) return;
      showMessage(context, "Request sent.");
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text("New request", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: "sample", label: Text("Sample")),
                ButtonSegment(value: "gift", label: Text("Gift")),
              ],
              selected: {_type},
              onSelectionChanged: (s) => setState(() {
                _type = s.first;
                _item = "";
              }),
            ),
            const SizedBox(height: 12),
            PickerField(
              key: ValueKey(_type),
              label: _type == "gift" ? "Gift" : "Sample",
              value: _item,
              options: _masters[_type == "gift" ? "promotional-gift" : "product-sample"] ?? const [],
              required: true,
              onChanged: (v) => setState(() => _item = v),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _qty,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Quantity *"),
              validator: (v) => (int.tryParse(v ?? "") ?? 0) <= 0 ? "Enter a quantity" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _remarks, decoration: const InputDecoration(labelText: "Remarks")),
            const SizedBox(height: 16),
            BusyButton(label: "Send request", busy: _saving, onPressed: _save, icon: Icons.send_rounded),
          ],
        ),
      ),
    );
  }
}
