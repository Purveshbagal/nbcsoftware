import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import HolidaySettingModel from "@/models/HolidaySetting";

// GET - Fetch holiday settings
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  let settings = await HolidaySettingModel.findOne();

  // Create default settings if not exists
  if (!settings) {
    const currentYear = new Date().getFullYear();

    settings = await HolidaySettingModel.create({
      sundayIsWorkingDay: false,
      holidays: [
        { name: "Republic Day", date: `${currentYear}-01-26`, enabled: true, autoFetch: true },
        { name: "Holi", date: `${currentYear}-03-25`, enabled: true, autoFetch: true },
        { name: "Gudi Padwa", date: `${currentYear}-03-31`, enabled: true, autoFetch: true },
        { name: "Labour Day", date: `${currentYear}-05-01`, enabled: true, autoFetch: false },
        { name: "Independence Day", date: `${currentYear}-08-15`, enabled: true, autoFetch: false },
        { name: "Ganesh Chaturthi", date: `${currentYear}-09-07`, enabled: true, autoFetch: true },
        { name: "Ganpati Visarjan", date: `${currentYear}-09-17`, enabled: true, autoFetch: true },
        { name: "Dussehra", date: `${currentYear}-10-12`, enabled: true, autoFetch: true },
        { name: "Diwali", date: `${currentYear}-11-01`, enabled: true, autoFetch: true },
        { name: "Makar Sankranti", date: `${currentYear}-01-14`, enabled: true, autoFetch: true },
      ],
    });
  }

  return NextResponse.json(settings);
}

// POST - Update holiday settings
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { sundayIsWorkingDay, holidays } = body;

  await connectToDatabase();

  let settings = await HolidaySettingModel.findOne();

  if (!settings) {
    settings = await HolidaySettingModel.create({
      sundayIsWorkingDay,
      holidays,
      updatedBy: {
        username: auth.session?.username || "admin",
        name: auth.session?.name || "Admin",
      },
    });
  } else {
    settings.sundayIsWorkingDay = sundayIsWorkingDay;
    settings.holidays = holidays;
    settings.updatedBy = {
      username: auth.session?.username || "admin",
      name: auth.session?.name || "Admin",
    };
    await settings.save();
  }

  return NextResponse.json({ message: "Settings updated successfully", settings });
}
