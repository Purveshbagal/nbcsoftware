"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, FileBarChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ReportColumn = {
  key: string;
  label: string;
  numeric?: boolean;
};

export type ReportRow = Record<string, string | number>;

export function ReportView({
  title,
  columns,
  rows,
  from,
  to,
  employee,
  employees,
  totalsRow,
}: {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  from: string;
  to: string;
  employee: string;
  employees: string[];
  totalsRow?: ReportRow;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localFrom, setLocalFrom] = React.useState(from);
  const [localTo, setLocalTo] = React.useState(to);

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function exportCsv() {
    const header = columns.map((column) => `"${column.label}"`).join(",");
    const body = rows.map((row) =>
      columns
        .map((column) => `"${String(row[column.key] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...body].join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${from}-to-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <form
        className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ from: localFrom, to: localTo });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="report-from">From</Label>
          <Input
            id="report-from"
            type="date"
            value={localFrom}
            onChange={(event) => setLocalFrom(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="report-to">To</Label>
          <Input
            id="report-to"
            type="date"
            value={localTo}
            onChange={(event) => setLocalTo(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="report-employee">Employee</Label>
          <Select
            value={employee || null}
            onValueChange={(value) => apply({ employee: (value as string) ?? "" })}
          >
            <SelectTrigger id="report-employee" className="min-w-48">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              {employees.length === 0 ? (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  No employees yet
                </div>
              ) : (
                employees.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Go</Button>
        {employee && (
          <Button type="button" variant="ghost" onClick={() => apply({ employee: "" })}>
            All employees
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          onClick={exportCsv}
          disabled={rows.length === 0}
        >
          <Download />
          Export
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <FileBarChart className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">
              Nothing recorded between {from} and {to}. Widen the dates, or record
              some activity first.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.numeric ? "text-right" : undefined}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.numeric ? "text-right tabular-nums" : undefined}
                    >
                      {row[column.key] === "" || row[column.key] === undefined
                        ? "-"
                        : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {totalsRow && (
                <TableRow className="bg-muted/50 font-semibold">
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.numeric ? "text-right tabular-nums" : undefined}
                    >
                      {totalsRow[column.key] ?? ""}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
