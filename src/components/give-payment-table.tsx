import { BadgeIndianRupee } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentRecord } from "@/types/payment";

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function GivePaymentTable({ payments }: { payments: PaymentRecord[] }) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <BadgeIndianRupee className="text-muted-foreground size-6" />
          </div>
          <p className="text-muted-foreground text-sm">
            No payments ready for disbursement yet. These appear once a
            survey form has been uploaded for an approved payment request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Gross Amount</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt No.</TableHead>
            <TableHead>Given By</TableHead>
            <TableHead>Paid On</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell className="font-medium">
                {payment.doctorName}
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({payment.doctorId})
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {payment.productName}
              </TableCell>
              <TableCell>₹{payment.amount.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                {payment.paidAt ? `₹${(payment.netAmount ?? payment.amount).toLocaleString("en-IN")}` : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={payment.paidAt ? "default" : "secondary"}>
                  {payment.paidAt ? "Paid" : "Pending Payment"}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {payment.receiptNumber ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {payment.paidBy?.name ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {payment.paidAt ? (
                  <a
                    href={`/api/payments/${payment._id}/receipt-pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    {formatDate(payment.paidAt)}
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
