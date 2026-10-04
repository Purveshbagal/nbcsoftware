import { collectionRoutes } from "@/lib/sfa-crud";
import { reminderCrud } from "@/lib/sfa-entities";
import ReminderModel from "@/models/Reminder";

export const { GET, POST } = collectionRoutes(() => ReminderModel, reminderCrud);
