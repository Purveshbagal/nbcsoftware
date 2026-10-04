import { itemRoutes } from "@/lib/sfa-crud";
import { reminderCrud } from "@/lib/sfa-entities";
import ReminderModel from "@/models/Reminder";

export const { PATCH, DELETE } = itemRoutes(() => ReminderModel, reminderCrud);
