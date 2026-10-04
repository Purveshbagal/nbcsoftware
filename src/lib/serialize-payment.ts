import type { Payment } from "@/models/Payment";
import type { PaymentRecord } from "@/types/payment";

type LeanPayment = Payment & { _id: { toString(): string } };

export function serializePayment(doc: LeanPayment): PaymentRecord {
  return {
    _id: doc._id.toString(),
    doctorId: doc.doctorId ?? "",
    doctorName: doc.doctorName ?? "",
    productId: doc.productId ?? "",
    productName: doc.productName ?? "",
    productComposition: doc.productComposition ?? undefined,
    amount: doc.amount,
    purpose: doc.purpose ?? undefined,
    status: (doc.status ?? "pending") as PaymentRecord["status"],
    requestedBy: doc.requestedBy ?? undefined,
    reviewedBy: doc.reviewedBy ?? undefined,
    reviewedAt: doc.reviewedAt ?? null,
    createdAt: doc.createdAt,
    surveyFormNo: doc.surveyFormNo ?? undefined,
    surveyDownloadedAt: doc.surveyDownloadedAt ?? null,
    surveyUploaded: Boolean(doc.surveyUpload?.data),
    surveyUploadedAt: doc.surveyUpload?.uploadedAt ?? null,
    receiptNumber: doc.receiptNumber ?? undefined,
    transactionRefNumber: doc.transactionRefNumber ?? undefined,
    tdsAmount: doc.tdsAmount ?? undefined,
    netAmount: doc.netAmount ?? undefined,
    paidAt: doc.paidAt ?? null,
    paidBy: doc.paidBy ?? undefined,
    handedOverAt: doc.handedOverAt ?? null,
    handedOverBy: doc.handedOverBy ?? undefined,
  };
}
