import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import ExpenseAllowanceModel from "@/models/ExpenseAllowance";

/**
 * GET /api/sfa/expense-settings/allowance
 * Get current allowance settings
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  let settings = await ExpenseAllowanceModel.findOne().lean();

  // Create default settings if none exist
  if (!settings) {
    settings = await ExpenseAllowanceModel.create({
      bikePerKm: 5,
      carPerKm: 8,
      publicTransportPerKm: 3,
      headquarterAllowance: 0,
      inCityAllowance: 0,
      outstationAllowance: 0,
    });
  }

  return NextResponse.json({
    settings: {
      _id: settings._id?.toString(),
      bikePerKm: settings.bikePerKm ?? 0,
      carPerKm: settings.carPerKm ?? 0,
      publicTransportPerKm: settings.publicTransportPerKm ?? 0,
      headquarterAllowance: settings.headquarterAllowance ?? 0,
      inCityAllowance: settings.inCityAllowance ?? 0,
      outstationAllowance: settings.outstationAllowance ?? 0,
    },
  });
}

/**
 * PATCH /api/sfa/expense-settings/allowance
 * Update allowance settings
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await connectToDatabase();

  const updateData: any = {
    updatedBy: {
      username: auth.session.username,
      name: auth.session.name,
    },
  };

  // Mode section
  if (body.bikePerKm !== undefined) updateData.bikePerKm = Number(body.bikePerKm) || 0;
  if (body.carPerKm !== undefined) updateData.carPerKm = Number(body.carPerKm) || 0;
  if (body.publicTransportPerKm !== undefined)
    updateData.publicTransportPerKm = Number(body.publicTransportPerKm) || 0;

  // Other allowances section
  if (body.headquarterAllowance !== undefined)
    updateData.headquarterAllowance = Number(body.headquarterAllowance) || 0;
  if (body.inCityAllowance !== undefined)
    updateData.inCityAllowance = Number(body.inCityAllowance) || 0;
  if (body.outstationAllowance !== undefined)
    updateData.outstationAllowance = Number(body.outstationAllowance) || 0;

  // Upsert settings (only one document should exist)
  const settings = await ExpenseAllowanceModel.findOneAndUpdate({}, updateData, {
    new: true,
    upsert: true,
  });

  return NextResponse.json({
    settings: {
      _id: settings._id?.toString(),
      bikePerKm: settings.bikePerKm,
      carPerKm: settings.carPerKm,
      publicTransportPerKm: settings.publicTransportPerKm,
      headquarterAllowance: settings.headquarterAllowance,
      inCityAllowance: settings.inCityAllowance,
      outstationAllowance: settings.outstationAllowance,
    },
  });
}
