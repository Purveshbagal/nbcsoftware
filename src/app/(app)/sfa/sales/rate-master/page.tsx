import Link from "next/link";

import { PageHeader } from "@/components/sfa/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { connectToDatabase } from "@/lib/mongodb";
import SfaProductModel from "@/models/SfaProduct";

type LeanProduct = {
  _id: { toString(): string };
  name: string;
  code?: string;
  pack?: string;
  division?: string;
  mrp?: number;
  ptr?: number;
  pts?: number;
};

function money(value?: number) {
  if (value === null || value === undefined) return "-";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default async function RateMasterPage() {
  await connectToDatabase();

  const products = await SfaProductModel.find({ isActive: true })
    .sort({ name: 1 })
    .lean<LeanProduct[]>();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Rate Master"
        description="All prices are inclusive of taxes. Rates are held on the product, so editing a product updates this list."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/sfa/products" />}>
            Edit products
          </Button>
        }
      />

      {products.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <p className="text-muted-foreground max-w-md py-16 text-center text-sm">
            No products yet. Add products with their MRP, PTR and PTS and the rate
            master fills itself.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sr.No.</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="hidden lg:table-cell">Pack</TableHead>
                <TableHead className="hidden lg:table-cell">Division</TableHead>
                <TableHead className="text-right">Retailer (MRP)</TableHead>
                <TableHead className="text-right">Stockist (PTR)</TableHead>
                <TableHead className="text-right">Distributor (PTS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product._id.toString()}>
                  <TableCell className="tabular-nums">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                    {product.code && (
                      <span className="text-muted-foreground block font-mono text-xs">
                        {product.code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{product.pack || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{product.division || "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(product.mrp)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(product.ptr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(product.pts)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
