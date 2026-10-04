import "bank_details.dart";

class Registration {
  final String id;
  final String doctorId;
  final String doctorName;
  final String? doctorAddress;
  final String? doctorQualification;
  final String registrationNumber;
  final String? mobileNumber;
  final String? hospitalName;
  final String? hospitalAddress;
  final String? doctorPanNumber;
  final BankDetails bankDetails;
  final String status;
  final DateTime? createdAt;

  const Registration({
    required this.id,
    required this.doctorId,
    required this.doctorName,
    this.doctorAddress,
    this.doctorQualification,
    required this.registrationNumber,
    this.mobileNumber,
    this.hospitalName,
    this.hospitalAddress,
    this.doctorPanNumber,
    this.bankDetails = const BankDetails(),
    required this.status,
    this.createdAt,
  });

  factory Registration.fromJson(Map<String, dynamic> json) {
    return Registration(
      id: json["_id"] as String? ?? "",
      doctorId: json["doctorId"] as String? ?? "",
      doctorName: json["doctorName"] as String? ?? "",
      doctorAddress: json["doctorAddress"] as String?,
      doctorQualification: json["doctorQualification"] as String?,
      registrationNumber: json["registrationNumber"] as String? ?? "",
      mobileNumber: json["mobileNumber"] as String?,
      hospitalName: json["hospitalName"] as String?,
      hospitalAddress: json["hospitalAddress"] as String?,
      doctorPanNumber: json["doctorPanNumber"] as String?,
      bankDetails: BankDetails.fromJson(
        json["bankDetails"] as Map<String, dynamic>?,
      ),
      status: json["status"] as String? ?? "pending",
      createdAt: json["createdAt"] != null
          ? DateTime.tryParse(json["createdAt"] as String)
          : null,
    );
  }
}
