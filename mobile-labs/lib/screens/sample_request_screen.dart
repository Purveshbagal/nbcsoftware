import "package:flutter/material.dart";

import "../services/api_client.dart";
import "../widgets/common.dart";

class SampleRequestScreen extends StatefulWidget {
  const SampleRequestScreen({super.key});
  @override
  State<SampleRequestScreen> createState() => _SampleRequestScreenState();
}

class _SampleRequestScreenState extends State<SampleRequestScreen> {
  List<dynamic> _products = [], _requests = [];
  final List<Map<String, dynamic>> _items = [];
  String? _productId;
  bool _loading = true, _sending = false;
  final _qty = TextEditingController(text: "1");

  @override
  void initState() { super.initState(); _load(); }
  @override
  void dispose() { _qty.dispose(); super.dispose(); }
  Future<void> _load() async {
    try {
      final data = await Future.wait([ApiClient.instance.get("/products"), ApiClient.instance.get("/sample-requests")]);
      if (mounted) setState(() { _products = data[0]["items"] ?? []; _requests = data[1]["items"] ?? []; _loading = false; });
    } catch (e) { if (mounted) { showError(context, e); setState(() => _loading = false); } }
  }
  void _add() {
    final qty = int.tryParse(_qty.text) ?? 0;
    if (_productId == null || qty < 1) return;
    final product = _products.firstWhere((p) => p["_id"].toString() == _productId);
    setState(() { _items.add({"productName": product["name"], "quantity": qty}); _productId = null; _qty.text = "1"; });
  }
  Future<void> _send() async {
    if (_items.isEmpty) return;
    setState(() => _sending = true);
    try { await ApiClient.instance.post("/sample-requests", {"items": _items}); _items.clear(); await _load(); if (mounted) showMessage(context, "Sample request sent for approval."); }
    catch (e) { if (mounted) showError(context, e); } finally { if (mounted) setState(() => _sending = false); }
  }
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text("Sample requests")),
    body: _loading ? const Center(child: CircularProgressIndicator()) : ListView(padding: const EdgeInsets.all(16), children: [
      DropdownButtonFormField<String>(value: _productId, decoration: const InputDecoration(labelText: "Product"), items: _products.map((p) => DropdownMenuItem(value: p["_id"].toString(), child: Text(p["name"]))).toList(), onChanged: (v) => setState(() => _productId = v)),
      const SizedBox(height: 12), TextField(controller: _qty, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Quantity")),
      const SizedBox(height: 12), OutlinedButton.icon(onPressed: _add, icon: const Icon(Icons.add), label: const Text("Add product")),
      for (final item in _items) ListTile(title: Text(item["productName"]), trailing: Text("Qty ${item["quantity"]}")),
      const SizedBox(height: 8), BusyButton(label: "Send request", busy: _sending, onPressed: _items.isEmpty ? null : _send),
      const SizedBox(height: 24), Text("Request history", style: Theme.of(context).textTheme.titleMedium),
      for (final row in _requests) ListTile(title: Text(str(row["item"])), subtitle: Text("Qty ${row["quantity"]}"), trailing: StatusChip(str(row["status"]))),
    ]),
  );
}
