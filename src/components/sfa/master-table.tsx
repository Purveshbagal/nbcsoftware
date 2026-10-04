"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ListTree, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { MasterItemRecord } from "@/types/sfa";

type FormState = {
  name: string;
  code: string;
  value: string;
  parent: string;
  description: string;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  value: "",
  parent: "",
  description: "",
  sortOrder: "0",
};

function toForm(item: MasterItemRecord): FormState {
  return {
    name: item.name,
    code: item.code,
    value: item.value === null ? "" : String(item.value),
    parent: item.parent,
    description: item.description,
    sortOrder: String(item.sortOrder),
  };
}

/**
 * Split from the dialog so the fields are a fresh mount on every open: the
 * portal unmounts its children when closed, so the initial state is recomputed
 * from `item` without an effect.
 */
function MasterForm({
  type,
  item,
  valueLabel,
  parentLabel,
  onDone,
}: {
  type: string;
  item: MasterItemRecord | null;
  valueLabel?: string;
  parentLabel?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(() =>
    item ? toForm(item) : emptyForm
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(
        item ? `/api/sfa/masters/${item._id}` : "/api/sfa/masters",
        {
          method: item ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, type }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save this entry");
        return;
      }

      toast.success(item ? "Entry updated." : "Entry added.");
      onDone();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{item ? "Edit entry" : "Add entry"}</DialogTitle>
        <DialogDescription>
          {item
            ? "Update this entry. It stays available to everyone using this list."
            : "Add an entry that the team can pick from this list."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="master-name">Name</Label>
        <Input
          id="master-name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="master-code">Code</Label>
          <Input
            id="master-code"
            value={form.code}
            onChange={(event) => update("code", event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="master-value">{valueLabel ?? "Value"}</Label>
          <Input
            id="master-value"
            type="number"
            step="any"
            value={form.value}
            onChange={(event) => update("value", event.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="master-parent">{parentLabel ?? "Group"}</Label>
          <Input
            id="master-parent"
            value={form.parent}
            onChange={(event) => update("parent", event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="master-sort">Sort order</Label>
          <Input
            id="master-sort"
            type="number"
            value={form.sortOrder}
            onChange={(event) => update("sortOrder", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="master-description">Description</Label>
        <Textarea
          id="master-description"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={2}
          placeholder="Optional"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {item ? "Save changes" : "Add entry"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function MasterDialog({
  type,
  item,
  open,
  onOpenChange,
  valueLabel,
  parentLabel,
}: {
  type: string;
  item: MasterItemRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valueLabel?: string;
  parentLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <MasterForm
          key={item?._id ?? "new"}
          type={type}
          item={item}
          valueLabel={valueLabel}
          parentLabel={parentLabel}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RowActions({
  item,
  onEdit,
}: {
  item: MasterItemRecord;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [toggling, setToggling] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function toggleActive() {
    setToggling(true);
    try {
      const res = await fetch(`/api/sfa/masters/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not update this entry");
        return;
      }
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sfa/masters/${item._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete this entry");
        return;
      }
      toast.success("Entry deleted.");
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={onEdit}>
        <Pencil />
        Edit
      </Button>
      <Button size="sm" variant="outline" disabled={toggling} onClick={toggleActive}>
        {toggling && <Loader2 className="size-4 animate-spin" />}
        {item.isActive ? "Deactivate" : "Activate"}
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
            <AlertDialogTitle>Delete &quot;{item.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Records already using this entry keep the text that was saved on
              them, but nobody will be able to pick it again. This cannot be
              undone.
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

export function MasterTable({
  type,
  items,
  valueLabel,
  parentLabel,
}: {
  type: string;
  items: MasterItemRecord[];
  valueLabel?: string;
  parentLabel?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MasterItemRecord | null>(null);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.name, item.code, item.parent, item.description]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [items, query]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: MasterItemRecord) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this list"
            className="pl-9"
            aria-label="Search this list"
          />
        </div>
        <span className="text-muted-foreground text-sm">
          {filtered.length} of {items.length}
        </span>
        <Button className="ml-auto" onClick={openAdd}>
          <Plus />
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <ListTree className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              This list is empty. Click &quot;Add&quot; to create the first entry.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>{valueLabel ?? "Value"}</TableHead>
                <TableHead>{parentLabel ?? "Group"}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">
                    {item.name}
                    {item.description && (
                      <span className="text-muted-foreground block text-xs">
                        {item.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.code || "-"}
                  </TableCell>
                  <TableCell>{item.value ?? "-"}</TableCell>
                  <TableCell>{item.parent || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RowActions item={item} onEdit={() => openEdit(item)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MasterDialog
        type={type}
        item={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        valueLabel={valueLabel}
        parentLabel={parentLabel}
      />
    </div>
  );
}
