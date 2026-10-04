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
  qrCode?: string;
};

export default async function ProductWithQrPage() {
  await connectToDatabase();

  const products = await SfaProductModel.find({ isActive: true })
    .sort({ name: 1 })
    .lean<LeanProduct[]>();

  const tagged = products.filter((product) => product.qrCode);
  const untagged = products.filter((product) => !product.qrCode);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Product With QR"
        description="Products carrying a QR or barcode on the pack, so a scan on the phone identifies them."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/sfa/products" />}>
            Edit products
          </Button>
        }
      />

      {products.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
          <p className="text-muted-foreground max-w-md py-16 text-center text-sm">
            No products yet. Add products first, then set a QR or barcode on each.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden lg:table-cell">Pack</TableHead>
                  <TableHead className="hidden lg:table-cell">Division</TableHead>
                  <TableHead>QR / Barcode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagged.map((product) => (
                  <TableRow key={product._id.toString()}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="hidden lg:table-cell">{product.pack || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{product.division || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{product.qrCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {untagged.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {untagged.length} active {untagged.length === 1 ? "product has" : "products have"} no
              QR or barcode set yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}
