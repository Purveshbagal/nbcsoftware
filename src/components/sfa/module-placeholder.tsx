import Link from "next/link";
import { Construction } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";

/**
 * An honest stub: the module is on the plan but nothing behind it works yet.
 * It says so plainly rather than showing an empty table that looks live.
 */
export function ModulePlaceholder({
  title,
  summary,
  willInclude,
  related,
}: {
  title: string;
  summary: string;
  willInclude: string[];
  related?: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title={title} description={summary} />

      <div className="bg-card flex flex-col gap-4 rounded-xl border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-700 flex size-10 items-center justify-center rounded-xl dark:bg-amber-500/15 dark:text-amber-300">
            <Construction className="size-5" />
          </div>
          <div>
            <p className="font-medium">Not built yet</p>
            <p className="text-muted-foreground text-sm">
              Nothing is stored or calculated on this screen so far.
            </p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-[.12em] uppercase">
            What it will hold
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {willInclude.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {related && related.length > 0 && (
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[.12em] uppercase">
              Working today
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {related.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:bg-muted rounded-lg border px-3 py-1.5 text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
