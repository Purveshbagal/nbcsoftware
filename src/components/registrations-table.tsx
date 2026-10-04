import { ListChecks } from "lucide-react";

import { RegistrationRowActions } from "@/components/registration-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RegistrationRecord } from "@/types/registration";

const statusVariant: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function RegistrationsTable({
  registrations,
  emptyMessage = "No registrations yet.",
  showActions = false,
}: {
  registrations: RegistrationRecord[];
  emptyMessage?: string;
  showActions?: boolean;
}) {
  if (registrations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <ListChecks className="text-muted-foreground size-6" />
          </div>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor ID</TableHead>
            <TableHead>Doctor Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Registration Number</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg) => (
            <TableRow key={reg._id}>
              <TableCell className="font-mono text-xs">{reg.doctorId}</TableCell>
              <TableCell className="font-medium">{reg.doctorName}</TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">
                {reg.doctorAddress || "-"}
              </TableCell>
              <TableCell>{reg.registrationNumber}</TableCell>
              <TableCell>{reg.requestedBy?.name ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[reg.status ?? "pending"]}>
                  {reg.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {reg.createdAt
                  ? new Date(reg.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "-"}
              </TableCell>
              {showActions && (
                <TableCell>
                  <RegistrationRowActions registration={reg} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
