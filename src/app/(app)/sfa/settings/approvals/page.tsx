import { notFound } from "next/navigation";

import { PageHeader } from "@/components/sfa/page-header";
import { SettingsForm } from "@/components/sfa/settings-form";
import { connectToDatabase } from "@/lib/mongodb";
import { findSettingGroup } from "@/lib/settings-schema";
import SettingModel from "@/models/Setting";

const SLUG = "approvals";

export default async function SettingsPage() {
  const group = findSettingGroup(SLUG);
  if (!group) {
    notFound();
  }

  await connectToDatabase();
  const rows = await SettingModel.find({ group: SLUG }).lean<{ key: string; value: string }[]>();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title={group.title} description={group.description} />
      <SettingsForm
        group={group}
        values={Object.fromEntries(rows.map((row) => [row.key, row.value]))}
      />
    </div>
  );
}
