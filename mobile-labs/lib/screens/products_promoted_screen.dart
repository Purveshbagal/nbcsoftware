import "package:flutter/material.dart";

import "../app_theme.dart";
import "../services/api_client.dart";
import "../widgets/common.dart";

/// Products Promoted Screen
/// User selects products promoted during the visit
/// With checkboxes for "Is Prescribing" and "Is in Top 5"
class ProductsPromotedScreen extends StatefulWidget {
  final String visitId;

  const ProductsPromotedScreen({super.key, required this.visitId});

  @override
  State<ProductsPromotedScreen> createState() => _ProductsPromotedScreenState();
}

class _ProductsPromotedScreenState extends State<ProductsPromotedScreen> {
  List<dynamic> _allProducts = [];
  List<Map<String, dynamic>> _selectedProducts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    try {
      final data = await ApiClient.instance.get("/products");
      setState(() {
        _allProducts = data["items"] ?? [];
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        showError(context, "Failed to load products: $e");
        setState(() => _loading = false);
      }
    }
  }

  void _addProduct() {
    showDialog(
      context: context,
      builder: (context) {
        String? selectedProductId;
        String? selectedProductName;
        bool isPrescribing = false;
        bool isTop5 = false;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text("Add Product Promoted"),
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

                    // Is Prescribing Checkbox
                    CheckboxListTile(
                      title: const Text("Is Prescribing"),
                      subtitle: const Text(
                        "Doctor is currently prescribing this product",
                        style: TextStyle(fontSize: 12),
                      ),
                      value: isPrescribing,
                      onChanged: (value) {
                        setDialogState(() => isPrescribing = value ?? false);
                      },
                      activeColor: AppTheme.indigo,
                      controlAffinity: ListTileControlAffinity.leading,
                    ),

                    // Is Top 5 Checkbox
                    CheckboxListTile(
                      title: const Text("Is in Top 5"),
                      subtitle: const Text(
                        "This product is in doctor's top 5 prescriptions",
                        style: TextStyle(fontSize: 12),
                      ),
                      value: isTop5,
                      onChanged: (value) {
                        setDialogState(() => isTop5 = value ?? false);
                      },
                      activeColor: AppTheme.indigo,
                      controlAffinity: ListTileControlAffinity.leading,
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
                          setState(() {
                            _selectedProducts.add({
                              "productId": selectedProductId!,
                              "productName": selectedProductName!,
                              "isPrescribing": isPrescribing,
                              "isTop5": isTop5,
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

  void _removeProduct(int index) {
    setState(() => _selectedProducts.removeAt(index));
  }

  void _save() {
    Navigator.of(context).pop(_selectedProducts);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Products Promoted"),
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
                          "Select products you promoted during this visit",
                          style: TextStyle(fontSize: 12, color: AppTheme.navy),
                        ),
                      ),
                    ],
                  ),
                ),

                // Selected Products List
                Expanded(
                  child: _selectedProducts.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.medication,
                                size: 64,
                                color: Colors.grey.shade300,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                "No products added yet",
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextButton.icon(
                                onPressed: _addProduct,
                                icon: const Icon(Icons.add),
                                label: const Text("Add Product"),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _selectedProducts.length,
                          itemBuilder: (context, index) {
                            final product = _selectedProducts[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            product["productName"],
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.delete,
                                            color: Colors.red,
                                          ),
                                          onPressed: () => _removeProduct(index),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      children: [
                                        if (product["isPrescribing"])
                                          Chip(
                                            label: const Text(
                                              "Prescribing",
                                              style: TextStyle(fontSize: 12),
                                            ),
                                            backgroundColor: Colors.green.shade100,
                                            padding: EdgeInsets.zero,
                                          ),
                                        if (product["isTop5"])
                                          Chip(
                                            label: const Text(
                                              "Top 5",
                                              style: TextStyle(fontSize: 12),
                                            ),
                                            backgroundColor: Colors.orange.shade100,
                                            padding: EdgeInsets.zero,
                                          ),
                                      ],
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
                        onPressed: _addProduct,
                        icon: const Icon(Icons.add),
                        label: const Text("Add Product"),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "${_selectedProducts.length} product(s) selected",
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
