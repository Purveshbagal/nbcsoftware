"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Inbox, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
import { orderTotals, type OrderLineInput } from "@/lib/order-payload";

export type OrderRow = {
  _id: string;
  orderNo?: string;
  orderDate?: string;
  firm?: string;
  doctor?: string;
  employeeName?: string;
  zone?: string;
  division?: string;
  remarks?: string;
  status?: string;
  lines?: OrderLineInput[];
};

const STATUSES = ["draft", "placed", "approved", "dispatched", "cancelled"];

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive"> = {
  approved: "default",
  dispatched: "default",
  placed: "secondary",
  draft: "secondary",
  cancelled: "destructive",
};

const emptyLine: OrderLineInput = { product: "", quantity: 1, rate: 0, discount: 0 };

const emptyOrder = {
  orderNo: "",
  orderDate: "",
  firm: "",
  doctor: "",
  employeeName: "",
  zone: "",
  division: "",
  remarks: "",
  status: "placed",
};

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/**
 * Split from the dialog so it is a fresh mount on every open: the portal
 * unmounts its children when closed, so the initial state is recomputed from
 * `order` without an effect.
 */
function OrderForm({
  order,
  onDone,
  options,
}: {
  order: OrderRow | null;
  onDone: () => void;
  options: {
    firms: string[];
    doctors: string[];
    employees: string[];
    products: string[];
    zones: string[];
    divisions: string[];
  };
}) {
  const router = useRouter();
  const [head, setHead] = React.useState(() =>
    order
      ? {
          orderNo: order.orderNo ?? "",
          orderDate: order.orderDate ?? "",
          firm: order.firm ?? "",
          doctor: order.doctor ?? "",
          employeeName: order.employeeName ?? "",
          zone: order.zone ?? "",
          division: order.division ?? "",
          remarks: order.remarks ?? "",
          status: order.status ?? "placed",
        }
      : emptyOrder
  );
  const [lines, setLines] = React.useState<OrderLineInput[]>(() =>
    order?.lines?.length ? order.lines.map((line) => ({ ...line })) : [{ ...emptyLine }]
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const totals = orderTotals(lines);

  function updateLine(index: number, patch: Partial<OrderLineInput>) {
    setLines((previous) =>
      previous.map((line, position) => (position === index ? { ...line, ...patch } : line))
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(order ? `/api/sfa/orders/${order._id}` : "/api/sfa/orders", {
        method: order ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...head, lines }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not save this order");
        return;
      }

      toast.success(order ? "Order updated." : "Order added.");
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
            <DialogTitle>{order ? "Edit order" : "Add order"}</DialogTitle>
            <DialogDescription>
              Line amounts are quantity × rate less the line discount. The order
              total is recalculated from the lines when it is saved.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="order-no">Order No</Label>
              <Input
                id="order-no"
                value={head.orderNo}
                onChange={(event) => setHead({ ...head, orderNo: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-date">
                Order Date<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="order-date"
                type="date"
                required
                value={head.orderDate}
                onChange={(event) => setHead({ ...head, orderDate: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-status">Status</Label>
              <Select
                value={head.status || null}
                onValueChange={(value) => setHead({ ...head, status: (value as string) ?? "" })}
              >
                <SelectTrigger id="order-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["firm", "Firm", options.firms],
                ["doctor", "Doctor", options.doctors],
                ["employeeName", "Employee", options.employees],
                ["zone", "Zone", options.zones],
                ["division", "Division", options.divisions],
              ] as const
            ).map(([key, label, choices]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={`order-${key}`}>{label}</Label>
                <Select
                  value={head[key] || null}
                  onValueChange={(value) => setHead({ ...head, [key]: (value as string) ?? "" })}
                >
                  <SelectTrigger id={`order-${key}`} className="w-full">
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {choices.length === 0 ? (
                      <div className="text-muted-foreground px-2 py-1.5 text-sm">
                        Nothing to pick yet
                      </div>
                    ) : (
                      choices.map((choice) => (
                        <SelectItem key={choice} value={choice}>
                          {choice}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-muted-foreground text-xs font-semibold tracking-[.12em] uppercase">
              Order lines
            </legend>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-48">Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Rate</TableHead>
                    <TableHead className="w-28">Disc %</TableHead>
                    <TableHead className="w-32 text-right">Amount</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => {
                    const amount = line.quantity * line.rate * (1 - line.discount / 100);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={line.product || null}
                            onValueChange={(value) =>
                              updateLine(index, { product: (value as string) ?? "" })
                            }
                          >
                            <SelectTrigger className="w-full" aria-label={`Product for line ${index + 1}`}>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {options.products.length === 0 ? (
                                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                                  Add products first
                                </div>
                              ) : (
                                options.products.map((product) => (
                                  <SelectItem key={product} value={product}>
                                    {product}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            aria-label={`Quantity for line ${index + 1}`}
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(index, { quantity: Number(event.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            aria-label={`Rate for line ${index + 1}`}
                            value={line.rate}
                            onChange={(event) =>
                              updateLine(index, { rate: Number(event.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                            aria-label={`Discount for line ${index + 1}`}
                            value={line.discount}
                            onChange={(event) =>
                              updateLine(index, { discount: Number(event.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{money(amount)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove line ${index + 1}`}
                            disabled={lines.length === 1}
                            onClick={() =>
                              setLines((previous) => previous.filter((_, position) => position !== index))
                            }
                          >
                            <X />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((previous) => [...previous, { ...emptyLine }])}
              >
                <Plus />
                Add line
              </Button>
              <span className="text-muted-foreground ml-auto text-sm">
                {totals.totalQuantity} units
              </span>
              <span className="text-base font-semibold tabular-nums">
                {money(totals.totalAmount)}
              </span>
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="order-remarks">Remarks</Label>
            <Textarea
              id="order-remarks"
              rows={2}
              value={head.remarks}
              onChange={(event) => setHead({ ...head, remarks: event.target.value })}
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
          {order ? "Save changes" : "Add order"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function OrderDialog({
  order,
  open,
  onOpenChange,
  options,
}: {
  order: OrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: React.ComponentProps<typeof OrderForm>["options"];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <OrderForm
          key={order?._id ?? "new"}
          order={order}
          options={options}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function OrdersTable({
  orders,
  options,
}: {
  orders: OrderRow[];
  options: {
    firms: string[];
    doctors: string[];
    employees: string[];
    products: string[];
    zones: string[];
    divisions: string[];
  };
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<OrderRow | null>(null);
  const [deleting, setDeleting] = React.useState<OrderRow | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const filtered = orders.filter((order) => {
    if (status && order.status !== status) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [order.orderNo, order.firm, order.doctor, order.employeeName]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  async function handleDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/sfa/orders/${deleting._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete this order");
        return;
      }
      toast.success("Order deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders"
            className="pl-9"
            aria-label="Search orders"
          />
        </div>
        <Select value={status || null} onValueChange={(value) => setStatus((value as string) ?? "")}>
          <SelectTrigger className="min-w-36" aria-label="Status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {status && (
          <Button variant="ghost" size="sm" onClick={() => setStatus("")}>
            Clear
          </Button>
        )}
        <span className="text-muted-foreground text-sm">
          {filtered.length} of {orders.length}
        </span>
        <Button
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          Add order
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Inbox className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">
              No orders yet. Add products and firms first, then book an order
              against a firm.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead className="hidden lg:table-cell">Doctor</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="hidden lg:table-cell">Zone</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const totals = orderTotals(order.lines ?? []);
                return (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.orderNo || "-"}</TableCell>
                    <TableCell>{order.orderDate || "-"}</TableCell>
                    <TableCell>{order.firm || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{order.doctor || "-"}</TableCell>
                    <TableCell>{order.employeeName || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{order.zone || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{totals.totalQuantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(totals.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_TONE[order.status ?? ""] ?? "secondary"}>
                        {order.status ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(order);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(order)}
                        >
                          <Trash2 />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <OrderDialog
        order={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        options={options}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Order {deleting?.orderNo || "(no number)"} and all of its lines will
              be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={removing} onClick={handleDelete}>
              {removing && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
