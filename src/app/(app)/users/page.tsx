import { NewUserDialog } from "@/components/new-user-dialog";
import { UsersTable } from "@/components/users-table";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeUser } from "@/lib/serialize-user";
import UserModel from "@/models/User";

export default async function UsersPage() {
  await connectToDatabase();
  const users = await UserModel.find({ role: "field" })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-muted-foreground text-sm">
            Create and manage field-user accounts for the mobile app.
          </p>
        </div>
        <NewUserDialog />
      </div>

      <UsersTable users={users.map(serializeUser)} />
    </div>
  );
}
