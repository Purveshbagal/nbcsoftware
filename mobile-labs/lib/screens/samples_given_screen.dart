import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// Samples Given Screen
/// User selects products and enters quantity of samples given
class SamplesGivenScreen extends StatefulWidget {
  final String visitId;

  const SamplesGivenScreen({super.key, required this.visitId});

  @override
  State<SamplesGivenScreen> createState() => _SamplesGivenScreenState();
}

class _SamplesGivenScreenState extends State<SamplesGivenScreen> {
  List<dynamic> _allProducts = [];
  List<Map<String, dynamic>> _selectedSamples = [];
  Map<String, int> _balances = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    try {
      final responses = await Future.wait([ApiClient.instance.get("/products"), ApiClient.instance.get("/sample-requests")]);
      setState(() {
        final balances = (responses[1]["balances"] as Map?) ?? {};
        _balances = balances.map((key, value) => MapEntry(key.toString(), (value as num).toInt()));
        _allProducts = (responses[0]["items"] as List? ?? []).where((p) => (_balances[p["name"]] ?? 0) > 0).toList();
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        showError(context, "Failed to load products: $e");
        setState(() => _loading = false);
      }
    }
  }

  void _addSample() {
    showDialog(
      context: context,
      builder: (context) {
        String? selectedProductId;
        String? selectedProductName;
        final quantityController = TextEditingController(text: "1");

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text("Add Sample Given"),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Dropdown
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: "Select Product *",
                        border: OutlineInputBorder(),
                      ),
                      value: selectedProductId,
                      items: _allProducts.map((product) {
                        return DropdownMenuItem<String>(
                          value: product["_id"].toString(),
                          child: Text(product["name"]),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setDialogState(() {
                          selectedProductId = value;
                          selectedProductName = _allProducts.firstWhere(
                            (p) => p["_id"].toString() == value,
                          )["name"];
                        });
                      },
                    ),

                    const SizedBox(height: 16),

                    // Quantity Input
                    TextFormField(
                      controller: quantityController,
                      decoration: const InputDecoration(
                        labelText: "Quantity *",
                        border: OutlineInputBorder(),
                        helperText: "Number of samples given",
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  onPressed: selectedProductId == null
                      ? null
                      : () {
                          final quantity = int.tryParse(quantityController.text.trim());
                          final available = _balances[selectedProductName] ?? 0;
                          if (quantity == null || quantity <= 0 || quantity > available) {
                            showError(context, "Enter a quantity up to approved stock ($available)");
                            return;
                          }

                          setState(() {
                            _selectedSamples.add({
                              "productId": selectedProductId!,
                              "productName": selectedProductName!,
                              "quantity": quantity,
                            });
                          });
                          Navigator.of(context).pop();
                        },
                  child: const Text("Add"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _removeSample(int index) {
    setState(() => _selectedSamples.removeAt(index));
  }

  void _editQuantity(int index) {
    final sample = _selectedSamples[index];
    final controller = TextEditingController(text: sample["quantity"].toString());

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Edit Quantity"),
          content: TextFormField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: "Quantity *",
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                final quantity = int.tryParse(controller.text.trim());
                if (quantity == null || quantity <= 0) {
                  showError(context, "Please enter a valid quantity");
                  return;
                }

                setState(() {
                  _selectedSamples[index]["quantity"] = quantity;
                });
                Navigator.of(context).pop();
              },
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  void _save() {
    Navigator.of(context).pop(_selectedSamples);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Samples Given"),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilledButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.check, size: 20),
              label: const Text("Done"),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.emerald,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Info Banner
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.indigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.indigo.withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: AppTheme.indigo, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Enter samples given to doctor during this visit",
                          style: TextStyle(fontSize: 12, color: AppTheme.navy),
                        ),
                      ),
                    ],
                  ),
                ),

                // Selected Samples List
                Expanded(
                  child: _selectedSamples.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.inventory_2,
                                size: 64,
                                color: Colors.grey.shade300,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                "No samples added yet",
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextButton.icon(
                                onPressed: _addSample,
                                icon: const Icon(Icons.add),
                                label: const Text("Add Sample"),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _selectedSamples.length,
                          itemBuilder: (context, index) {
                            final sample = _selectedSamples[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: AppTheme.indigo.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.inventory_2,
                                    color: AppTheme.indigo,
                                  ),
                                ),
                                title: Text(
                                  sample["productName"],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Text(
                                  "Quantity: ${sample["quantity"]} · Approved balance: ${_balances[sample["productName"]] ?? 0}",
                                  style: const TextStyle(fontSize: 13),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 20),
                                      onPressed: () => _editQuantity(index),
                                      tooltip: "Edit Quantity",
                                    ),
                                    IconButton(
                                      icon: const Icon(
                                        Icons.delete,
                                        color: Colors.red,
                                        size: 20,
                                      ),
                                      onPressed: () => _removeSample(index),
                                      tooltip: "Remove",
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),

                // Add Button (sticky at bottom)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      OutlinedButton.icon(
                        onPressed: _addSample,
                        icon: const Icon(Icons.add),
                        label: const Text("Add Sample"),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "${_selectedSamples.length} sample(s) selected • Total: ${_selectedSamples.fold<int>(0, (sum, s) => sum + (s["quantity"] as int))} units",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
