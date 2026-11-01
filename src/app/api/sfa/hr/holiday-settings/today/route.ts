import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HolidaySettingModel from "@/models/HolidaySetting";

// GET - Check if today is a holiday
export async function GET() {
  await connectToDatabase();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const dayOfWeek = today.getDay(); // 0 = Sunday

  const settings = await HolidaySettingModel.findOne();

  let isHoliday = false;
  let holidayName = "";

  // Check if it's Sunday and Sunday is not a working day
  if (!settings?.sundayIsWorkingDay && dayOfWeek === 0) {
    isHoliday = true;
    holidayName = "Sunday";
  }

  // Check if today is in the enabled holidays list
  if (settings) {
    const todayHoliday = settings.holidays.find(
      (h: any) => h.enabled && h.date === todayStr
    );

    if (todayHoliday) {
      isHoliday = true;
      holidayName = todayHoliday.name;
    }
  }

  return NextResponse.json({
    isHoliday,
    holidayName,
    date: todayStr,
  });
}
