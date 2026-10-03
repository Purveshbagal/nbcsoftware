import { AutoRefresh } from "@/components/auto-refresh";
import { RegistrationsTable } from "@/components/registrations-table";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeRegistration } from "@/lib/serialize-registration";
import RegistrationModel from "@/models/Registration";

export default async function RegisterListPage() {
  await connectToDatabase();
  const registrations = await RegistrationModel.find()
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <AutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Register List</h2>
        <p className="text-muted-foreground text-sm">
          View and manage all registered entries.
        </p>
      </div>

      <RegistrationsTable
        registrations={registrations.map(serializeRegistration)}
        emptyMessage="No registrations yet. Submit one from the mobile app."
        showActions
      />
    </div>
  );
}
