import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import HolidaySettingModel from "@/models/HolidaySetting";

// Indian holiday mapping (approximate dates that change yearly)
const INDIAN_HOLIDAYS_KEYWORDS = [
  "Holi",
  "Gudi Padwa",
  "Ganesh Chaturthi",
  "Ganpati Visarjan",
  "Dussehra",
  "Diwali",
  "Makar Sankranti",
];

// POST - Fetch and update holidays from public holiday API
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const currentYear = new Date().getFullYear();

  try {
    // Fetch Indian holidays from Calendarific API (free public holidays API)
    // Note: This is a simple implementation. For production, you'd want to use Google Calendar API
    // or a proper holiday API with an API key

    // For now, we'll calculate the approximate dates for Hindu festivals
    // In production, you should use a proper API like:
    // - Google Calendar API
    // - Calendarific API
    // - AbstractAPI Holidays

    const settings = await HolidaySettingModel.findOne();
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    // Update holidays with calculated dates
    // This is a placeholder - in production, fetch from actual API
    const updatedHolidays = settings.holidays.map((holiday: any) => {
      if (!holiday.autoFetch) return holiday;

      // Fixed holidays
      if (holiday.name === "Republic Day") {
        return { ...holiday, date: `${currentYear}-01-26` };
      }
      if (holiday.name === "Labour Day") {
        return { ...holiday, date: `${currentYear}-05-01` };
      }
      if (holiday.name === "Independence Day") {
        return { ...holiday, date: `${currentYear}-08-15` };
      }
      if (holiday.name === "Makar Sankranti") {
        return { ...holiday, date: `${currentYear}-01-14` };
      }

      // For Hindu festivals, keep the existing date or use approximate
      // In production, fetch from API
      return holiday;
    });

    settings.holidays = updatedHolidays;
    settings.lastFetchedAt = new Date();
    settings.updatedBy = {
      username: auth.session?.username || "admin",
      name: auth.session?.name || "System Auto-Fetch",
    };
    await settings.save();

    return NextResponse.json({
      message: "Holidays updated successfully",
      lastFetchedAt: settings.lastFetchedAt,
      holidays: updatedHolidays,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch holidays", details: error.message },
      { status: 500 }
    );
  }
}
