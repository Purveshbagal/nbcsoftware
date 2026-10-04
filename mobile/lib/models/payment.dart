class Payment {
  final String id;
  final String doctorId;
  final String doctorName;
  final String productId;
  final String productName;
  final String? productComposition;
  final num amount;
  final String? purpose;
  final String status;
  final DateTime? createdAt;
  final String? surveyFormNo;
  final DateTime? surveyDownloadedAt;
  final bool surveyUploaded;
  final DateTime? surveyUploadedAt;
  final String? receiptNumber;
  final String? transactionRefNumber;
  final num? tdsAmount;
  final num? netAmount;
  final DateTime? paidAt;
  final DateTime? handedOverAt;

  const Payment({
    required this.id,
    required this.doctorId,
    required this.doctorName,
    required this.productId,
    required this.productName,
    this.productComposition,
    required this.amount,
    this.purpose,
    required this.status,
    this.createdAt,
    this.surveyFormNo,
    this.surveyDownloadedAt,
    this.surveyUploaded = false,
    this.surveyUploadedAt,
    this.receiptNumber,
    this.transactionRefNumber,
    this.tdsAmount,
    this.netAmount,
    this.paidAt,
    this.handedOverAt,
  });

  bool get readyToGive =>
      status == "approved" && surveyUploaded && !paymentGiven;

  bool get paymentGiven => paidAt != null;

  /// The admin has generated the receipt but the rep has not yet recorded
  /// handing the cash to the doctor.
  bool get readyToHandOver => paymentGiven && !handedOverToDoctor;

  bool get handedOverToDoctor => handedOverAt != null;

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json["_id"] as String? ?? "",
      doctorId: json["doctorId"] as String? ?? "",
      doctorName: json["doctorName"] as String? ?? "",
      productId: json["productId"] as String? ?? "",
      productName: json["productName"] as String? ?? "",
      productComposition: json["productComposition"] as String?,
      amount: json["amount"] as num? ?? 0,
      purpose: json["purpose"] as String?,
      status: json["status"] as String? ?? "pending",
      createdAt: json["createdAt"] != null
          ? DateTime.tryParse(json["createdAt"] as String)
          : null,
      surveyFormNo: json["surveyFormNo"] as String?,
      surveyDownloadedAt: json["surveyDownloadedAt"] != null
          ? DateTime.tryParse(json["surveyDownloadedAt"] as String)
          : null,
      surveyUploaded: json["surveyUploaded"] as bool? ?? false,
      surveyUploadedAt: json["surveyUploadedAt"] != null
          ? DateTime.tryParse(json["surveyUploadedAt"] as String)
          : null,
      receiptNumber: json["receiptNumber"] as String?,
      transactionRefNumber: json["transactionRefNumber"] as String?,
      tdsAmount: json["tdsAmount"] as num?,
      netAmount: json["netAmount"] as num?,
      paidAt: json["paidAt"] != null
          ? DateTime.tryParse(json["paidAt"] as String)
          : null,
      handedOverAt: json["handedOverAt"] != null
          ? DateTime.tryParse(json["handedOverAt"] as String)
          : null,
    );
  }
}
