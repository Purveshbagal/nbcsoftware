class BankDetails {
  final String bankName;
  final String accountNumber;
  final String ifscCode;
  final String branchName;

  const BankDetails({
    this.bankName = "",
    this.accountNumber = "",
    this.ifscCode = "",
    this.branchName = "",
  });

  factory BankDetails.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const BankDetails();
    return BankDetails(
      bankName: json["bankName"] as String? ?? "",
      accountNumber: json["accountNumber"] as String? ?? "",
      ifscCode: json["ifscCode"] as String? ?? "",
      branchName: json["branchName"] as String? ?? "",
    );
  }

  Map<String, dynamic> toJson() => {
        "bankName": bankName,
        "accountNumber": accountNumber,
        "ifscCode": ifscCode,
        "branchName": branchName,
      };

  bool get isEmpty =>
      bankName.isEmpty &&
      accountNumber.isEmpty &&
      ifscCode.isEmpty &&
      branchName.isEmpty;
}
