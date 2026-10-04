class Product {
  final String id;
  final String name;
  final String composition;
  final String category;
  final String? pack;
  final String? specialClaim;

  const Product({
    required this.id,
    required this.name,
    required this.composition,
    required this.category,
    this.pack,
    this.specialClaim,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json["_id"] as String? ?? "",
      name: json["name"] as String? ?? "",
      composition: json["composition"] as String? ?? "",
      category: json["category"] as String? ?? "",
      pack: json["pack"] as String?,
      specialClaim: json["specialClaim"] as String?,
    );
  }
}
