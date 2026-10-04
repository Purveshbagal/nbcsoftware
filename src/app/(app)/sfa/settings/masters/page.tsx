import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { connectToDatabase } from "@/lib/mongodb";
import { MASTER_TYPES } from "@/lib/workspaces";
import MasterItemModel from "@/models/MasterItem";

export default async function MastersIndexPage() {
  await connectToDatabase();

  const counts = await MasterItemModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const countByType = new Map(counts.map((row) => [row._id, row.count]));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Application Master"
        description="The lists the field team picks from. Every screen here behaves the same way: add, edit, deactivate or delete entries."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MASTER_TYPES.map((master) => {
          const count = countByType.get(master.slug) ?? 0;
          return (
            <Link
              key={master.slug}
              href={`/sfa/settings/masters/${master.slug}`}
              className="group bg-card hover:border-primary/40 flex flex-col gap-1 rounded-xl border p-4 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{master.title}</span>
                <ArrowUpRight className="text-muted-foreground group-hover:text-primary ml-auto size-4" />
              </div>
              <p className="text-muted-foreground text-xs">{master.description}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                {count === 0 ? "No entries yet" : `${count} ${count === 1 ? "entry" : "entries"}`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
