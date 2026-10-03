import { AutoRefresh } from "@/components/auto-refresh";
import { RegistrationsTable } from "@/components/registrations-table";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeRegistration } from "@/lib/serialize-registration";
import RegistrationModel from "@/models/Registration";

export default async function RegisterApprovalHistoryPage() {
  await connectToDatabase();
  const registrations = await RegistrationModel.find({
    status: { $ne: "pending" },
  })
    .sort({ reviewedAt: -1 })
    .lean();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <AutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Register Approval History
        </h2>
        <p className="text-muted-foreground text-sm">
          Past registration decisions — approved and rejected requests.
        </p>
      </div>

      <RegistrationsTable
        registrations={registrations.map(serializeRegistration)}
        emptyMessage="No registration decisions yet."
      />
    </div>
  );
}
