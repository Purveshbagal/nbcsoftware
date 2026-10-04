"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import type { Column, EntityRow, Field, FilterSpec } from "@/lib/sfa-ui";

const PAGE_SIZES = [25, 50, 100];

const BADGE_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  closed: "default",
  active: "default",
  done: "default",
  resolved: "default",
  dispatched: "default",
  pending: "secondary",
  planned: "secondary",
  open: "secondary",
  draft: "secondary",
  placed: "secondary",
  "in-progress": "secondary",
  inactive: "outline",
  rejected: "destructive",
  skipped: "destructive",
  cancelled: "destructive",
};

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function cellText(row: EntityRow, column: Column): string {
  const value = row[column.key];

  switch (column.type) {
    case "date":
      return formatDate(value);
    case "list":
      return Array.isArray(value) ? value.join(", ") : String(value ?? "");
    case "bool":
      return value ? "Yes" : "No";
    case "currency": {
      if (value === null || value === undefined || value === "") return "-";
      return `₹${Number(value).toLocaleString("en-IN")}`;
    }
    case "number":
      return value === null || value === undefined || value === "" ? "-" : String(value);
    default:
      return value === null || value === undefined || value === "" ? "" : String(value);
  }
}

function emptyFormFor(fields: Field[]): Record<string, string | boolean | string[]> {
  const form: Record<string, string | boolean | string[]> = {};
  for (const field of fields) {
    if (field.type === "checkbox") form[field.key] = true;
    else if (field.type === "multiselect") form[field.key] = [];
    else form[field.key] = "";
  }
  return form;
}

function rowToForm(row: EntityRow, fields: Field[]) {
  const form = emptyFormFor(fields);
  for (const field of fields) {
    const value = row[field.key];
    if (field.type === "checkbox") form[field.key] = Boolean(value);
    else if (field.type === "multiselect")
      form[field.key] = Array.isArray(value) ? value.map(String) : [];
    else form[field.key] = value === null || value === undefined ? "" : String(value);
  }
  return form;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | boolean | string[];
  onChange: (value: string | boolean | string[]) => void;
}) {
  const id = `field-${field.key}`;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-[var(--primary)]"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  const control = (() => {
    if (field.type === "select") {
      return (
        <Select
          value={(value as string) || null}
          onValueChange={(next) => onChange((next as string) ?? "")}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).length === 0 ? (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                Nothing to pick yet — add entries under Settings.
              </div>
            ) : (
              (field.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "multiselect") {
      const selected = (value as string[]) ?? [];
      return (
        <div className="max-h-40 overflow-y-auto rounded-lg border p-2">
          {(field.options ?? []).length === 0 ? (
            <p className="text-muted-foreground px-1 py-1 text-sm">
              Nothing to pick yet — add entries under Settings.
            </p>
          ) : (
            (field.options ?? []).map((option) => (
              <label key={option} className="flex items-center gap-2 px-1 py-1 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={selected.includes(option)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option)
                    )
                  }
                />
                {option}
              </label>
            ))
          )}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          id={id}
          rows={2}
          value={value as string}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }

    return (
      <Input
        id={id}
        type={field.type ?? "text"}
        value={value as string}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  })();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      {control}
    </div>
  );
}

/**
 * Split from the dialog so the form is a fresh mount on every open: the portal
 * unmounts its children when closed, so the initial state is recomputed from
 * `row` without an effect.
 */
function EntityForm({
  endpoint,
  entityName,
  fields,
  row,
  onDone,
  defaults,
}: {
  endpoint: string;
  entityName: string;
  fields: Field[];
  row: EntityRow | null;
  onDone: () => void;
  defaults: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState(() =>
    row ? rowToForm(row, fields) : emptyFormFor(fields)
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const sections = React.useMemo(() => {
    const map = new Map<string, Field[]>();
    for (const field of fields) {
      const section = field.section ?? "Details";
      const list = map.get(section) ?? [];
      list.push(field);
      map.set(section, list);
    }
    return [...map.entries()];
  }, [fields]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(row ? `${endpoint}/${row._id}` : endpoint, {
        method: row ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        // `defaults` pins fields the screen owns, such as the tab a row belongs to.
        body: JSON.stringify({ ...form, ...defaults }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? `Could not save this ${entityName.toLowerCase()}`);
        return;
      }

      toast.success(row ? `${entityName} updated.` : `${entityName} added.`);
      onDone();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>
          {row ? `Edit ${entityName.toLowerCase()}` : `Add ${entityName.toLowerCase()}`}
        </DialogTitle>
        <DialogDescription>
          Fields marked * are required. Lists are managed under Settings →
          Application Master.
        </DialogDescription>
      </DialogHeader>

      {sections.map(([section, sectionFields]) => (
        <fieldset key={section} className="grid gap-4">
          <legend className="text-muted-foreground text-xs font-semibold tracking-[.12em] uppercase">
            {section}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {sectionFields.map((field) => (
              <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
                <FieldInput
                  field={field}
                  value={form[field.key]}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, [field.key]: value }))
                  }
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {row ? "Save changes" : `Add ${entityName.toLowerCase()}`}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EntityDialog({
  endpoint,
  entityName,
  fields,
  row,
  open,
  onOpenChange,
  defaults,
}: {
  endpoint: string;
  entityName: string;
  fields: Field[];
  row: EntityRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: Record<string, string>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <EntityForm
          key={row?._id ?? "new"}
          endpoint={endpoint}
          entityName={entityName}
          fields={fields}
          row={row}
          defaults={defaults}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RowActions({
  endpoint,
  entityName,
  row,
  labelKey,
  onEdit,
}: {
  endpoint: string;
  entityName: string;
  row: EntityRow;
  labelKey: string;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`${endpoint}/${row._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete this record");
        return;
      }
      toast.success(`${entityName} deleted.`);
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const label = String(row[labelKey] ?? "this record");

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={onEdit}>
        <Pencil />
        Edit
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
        Delete
      </Button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{label}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the record. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function EntityTable({
  endpoint,
  entityName,
  rows,
  columns,
  fields,
  filters = [],
  labelKey = "name",
  emptyMessage,
  readOnly = false,
  defaults = {},
}: {
  endpoint: string;
  entityName: string;
  rows: EntityRow[];
  columns: Column[];
  fields: Field[];
  filters?: FilterSpec[];
  labelKey?: string;
  emptyMessage?: string;
  readOnly?: boolean;
  /** Values forced onto every create from this screen. */
  defaults?: Record<string, string>;
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<Record<string, string>>({});
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZES[0]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EntityRow | null>(null);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return rows.filter((row) => {
      for (const [key, value] of Object.entries(active)) {
        if (!value) continue;
        const cell = row[key];
        const matches = Array.isArray(cell)
          ? cell.map(String).includes(value)
          : String(cell ?? "") === value;
        if (!matches) return false;
      }

      if (!needle) return true;
      return columns.some((column) =>
        cellText(row, column).toLowerCase().includes(needle)
      );
    });
  }, [rows, query, active, columns]);

  // A narrowed result set can leave the viewer past the last page.
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function exportCsv() {
    const header = columns.map((column) => column.label);
    const lines = filtered.map((row) =>
      columns.map((column) => {
        const text = cellText(row, column).replace(/"/g, '""');
        return `"${text}"`;
      })
    );
    const csv = [header.map((h) => `"${h}"`).join(","), ...lines.map((l) => l.join(","))].join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${entityName.toLowerCase().replace(/\s+/g, "-")}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={`Search ${entityName.toLowerCase()}s`}
            className="pl-9"
            aria-label={`Search ${entityName.toLowerCase()}s`}
          />
        </div>

        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={active[filter.key] ?? null}
            onValueChange={(value) => {
              setActive((previous) => ({ ...previous, [filter.key]: (value as string) ?? "" }));
              setPage(0);
            }}
          >
            <SelectTrigger className="min-w-36" aria-label={filter.label}>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.length === 0 ? (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">No values yet</div>
              ) : (
                filter.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        ))}

        {Object.values(active).some(Boolean) && (
          <Button variant="ghost" size="sm" onClick={() => setActive({})}>
            Clear filters
          </Button>
        )}

        <span className="text-muted-foreground text-sm">
          {filtered.length} of {rows.length}
        </span>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download />
            Export
          </Button>
          {!readOnly && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus />
              Add {entityName.toLowerCase()}
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Inbox className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">
              {emptyMessage ??
                `No ${entityName.toLowerCase()}s yet. Click "Add ${entityName.toLowerCase()}" to create the first one.`}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={column.secondary ? "hidden lg:table-cell" : undefined}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row._id}>
                    {columns.map((column) => {
                      const text = cellText(row, column);
                      return (
                        <TableCell
                          key={column.key}
                          className={column.secondary ? "hidden lg:table-cell" : undefined}
                        >
                          {column.type === "badge" && text ? (
                            <Badge variant={BADGE_TONE[text.toLowerCase()] ?? "secondary"}>
                              {text}
                            </Badge>
                          ) : (
                            text || "-"
                          )}
                        </TableCell>
                      );
                    })}
                    {!readOnly && (
                      <TableCell>
                        <RowActions
                          endpoint={endpoint}
                          entityName={entityName}
                          row={row}
                          labelKey={labelKey}
                          onEdit={() => {
                            setEditing(row);
                            setDialogOpen(true);
                          }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger size="sm" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">
              Page {safePage + 1} of {pageCount}
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {!readOnly && (
        <EntityDialog
          endpoint={endpoint}
          entityName={entityName}
          fields={fields}
          row={editing}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaults={defaults}
        />
      )}
    </div>
  );
}
