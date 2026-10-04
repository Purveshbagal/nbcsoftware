import "package:flutter/material.dart";

import "../services/api_client.dart";
import "../widgets/common.dart";
import "directory_screen.dart";

num _orderTotal(Json order) {
  final lines = ((order["lines"] as List?) ?? const []).cast<Json>();
  return lines.fold<num>(0, (sum, l) {
    final qty = (l["quantity"] as num?) ?? 0;
    final rate = (l["rate"] as num?) ?? 0;
    final discount = (l["discount"] as num?) ?? 0;
    return sum + qty * rate * (1 - discount / 100);
  });
}

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _loader = GlobalKey<LoadViewState<List<Json>>>();

  Future<void> _add() async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const NewOrderScreen()));
    if (saved == true) _loader.currentState?.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Orders (POB)")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add_shopping_cart_rounded),
        label: const Text("Book order"),
      ),
      body: LoadView<List<Json>>(
        key: _loader,
        load: () => ApiClient.instance.list("/orders"),
        builder: (context, items) {
          if (items.isEmpty) {
            return ListView(children: const [EmptyState(icon: Icons.shopping_cart_rounded, message: "No orders booked yet.")]);
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final o = items[i];
              final lines = ((o["lines"] as List?) ?? const []).cast<Json>();
              return RecordTile(
                title: "${o["firm"]} · ${fmtRupees(_orderTotal(o))}",
                subtitle: lines.map((l) => "${l["product"]} × ${l["quantity"]}").join(", "),
                meta: "${o["orderNo"] ?? ""} · ${fmtDate(o["orderDate"])}",
                status: str(o["status"]),
              );
            },
          );
        },
      ),
    );
  }
}

class _Line {
  final Json product;
  int quantity;
  double rate;
  _Line(this.product, this.quantity, this.rate);
}

class NewOrderScreen extends StatefulWidget {
  const NewOrderScreen({super.key});

  @override
  State<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends State<NewOrderScreen> {
  Json? _firm;
  final List<_Line> _lines = [];
  List<Json> _products = [];
  final _remarks = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    ApiClient.instance.list("/products").then((p) {
      if (mounted) setState(() => _products = p);
    }).catchError((Object e) {
      if (mounted) showError(context, e);
    });
  }

  @override
  void dispose() {
    _remarks.dispose();
    super.dispose();
  }

  double get _total => _lines.fold(0, (s, l) => s + l.quantity * l.rate);

  Future<void> _pickFirm() async {
    final firm = await Navigator.of(context).push<Json>(
      MaterialPageRoute(builder: (_) => const DirectoryScreen(initialType: "firm", pickMode: true)),
    );
    if (firm != null) setState(() => _firm = firm);
  }

  Future<void> _addProduct() async {
    if (_products.isEmpty) {
      showMessage(context, "The product list is empty. Ask the office to add products.");
      return;
    }
    final names = _products.map((p) => str(p["name"])).toList();
    final picked = await pickOne(context, title: "Add product", options: names);
    if (picked == null) return;
    final product = _products.firstWhere((p) => p["name"] == picked);
    final existing = _lines.where((l) => l.product["name"] == picked).firstOrNull;
    setState(() {
      if (existing != null) {
        existing.quantity++;
      } else {
        _lines.add(_Line(product, 1, ((product["ptr"] ?? product["pts"] ?? product["mrp"] ?? 0) as num).toDouble()));
      }
    });
  }

  Future<void> _save() async {
    if (_firm == null) {
      showMessage(context, "Choose the firm this order is for.");
      return;
    }
    if (_lines.isEmpty) {
      showMessage(context, "Add at least one product.");
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post("/orders", {
        "firm": _firm!["name"],
        "remarks": _remarks.text.trim(),
        "lines": [
          for (final l in _lines) {"product": l.product["name"], "quantity": l.quantity, "rate": l.rate, "discount": 0},
        ],
      });
      if (!mounted) return;
      showMessage(context, "Order booked.");
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Book order")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.storefront_rounded),
              title: Text(_firm == null ? "Choose firm *" : str(_firm!["name"])),
              subtitle: _firm == null ? null : Text(str(_firm!["city"])),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: _pickFirm,
            ),
          ),
          const SectionLabel("Products"),
          for (final line in _lines)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 8, 4, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(str(line.product["name"]), style: Theme.of(context).textTheme.titleMedium),
                          Text("${fmtRupees(line.rate)} each · ${fmtRupees(line.rate * line.quantity)}", style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => setState(() => line.quantity > 1 ? line.quantity-- : _lines.remove(line)),
                      icon: Icon(line.quantity > 1 ? Icons.remove_circle_outline_rounded : Icons.delete_outline_rounded),
                    ),
                    Text("${line.quantity}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    IconButton(onPressed: () => setState(() => line.quantity++), icon: const Icon(Icons.add_circle_outline_rounded)),
                  ],
                ),
              ),
            ),
          OutlinedButton.icon(onPressed: _addProduct, icon: const Icon(Icons.add_rounded), label: const Text("Add product")),
          const SizedBox(height: 12),
          TextField(controller: _remarks, decoration: const InputDecoration(labelText: "Remarks")),
          const SizedBox(height: 16),
          Row(
            children: [
              Text("Total", style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              Text(fmtRupees(_total), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 16),
          BusyButton(label: "Book order", busy: _saving, onPressed: _save, icon: Icons.check_rounded),
        ],
      ),
    );
  }
}
