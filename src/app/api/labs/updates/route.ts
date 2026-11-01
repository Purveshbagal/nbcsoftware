import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import { requireLabsAuth } from "@/lib/labs-auth";
import EmployeeUpdateModel from "@/models/EmployeeUpdate";

/**
 * POST - Employee posts a daily work update
 * Unlimited updates allowed per day
 */
export async function POST(request: Request) {
  const auth = await requireLabsAuth(request);
  if (auth.error) {
    return auth.error;
  }

  const body = (await readJsonBody<Record<string, any>>(request)) ?? {};
  const updateText = String(body?.updateText ?? "").trim();
  const location = body?.location as { latitude?: number; longitude?: number } | undefined;
  const deviceInfo = String(body?.device ?? "").slice(0, 200);

  if (!updateText) {
    return NextResponse.json(
      { error: "Update text is required" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const update = await EmployeeUpdateModel.create({
    employeeId: auth.employee._id,
    employeeName: auth.employee.name,
    employeeUsername: auth.employee.appUsername,
    updateText,
    updateDate: today,
    location: location ? {
      latitude: location.latitude,
      longitude: location.longitude,
    } : undefined,
    deviceInfo,
  });

  return NextResponse.json({
    ok: true,
    update: {
      id: update._id.toString(),
      updateText: update.updateText,
      createdAt: update.createdAt,
    },
  });
}

/**
 * GET - Get employee's own updates
 * Optional query params: date (YYYY-MM-DD)
 */
export async function GET(request: Request) {
  const auth = await requireLabsAuth(request);
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // Optional: specific date

  await connectToDatabase();

  const query: any = { employeeId: auth.employee._id };

  // Filter by date if provided
  if (date) {
    query.updateDate = date;
  }

  const updates = await EmployeeUpdateModel.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({
    ok: true,
    updates: updates.map(u => ({
      id: u._id.toString(),
      updateText: u.updateText,
      updateDate: u.updateDate,
      createdAt: u.createdAt,
      location: u.location,
    })),
  });
}
