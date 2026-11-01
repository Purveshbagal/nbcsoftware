import { Metadata } from "next";
import HolidaySettingsForm from "@/components/sfa/holiday-settings-form";

export const metadata: Metadata = {
  title: "Holiday Settings",
  description: "Configure working days and holidays",
};

export const dynamic = "force-dynamic";

export default async function HolidaySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Holiday Settings</h1>
        <p className="text-muted-foreground">
          Configure Sunday as working day and manage annual holidays
        </p>
      </div>

      <HolidaySettingsForm />
    </div>
  );
}
