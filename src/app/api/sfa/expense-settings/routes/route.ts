import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import ExpenseRouteModel from "@/models/ExpenseRoute";
import MasterItemModel from "@/models/MasterItem";

/**
 * GET /api/sfa/expense-settings/routes
 * Get all expense routes
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const routes = await ExpenseRouteModel.find({ isActive: true })
    .sort({ fromTaluka: 1, toTaluka: 1 })
    .lean();

  return NextResponse.json({
    routes: routes.map((r) => ({
      _id: r._id?.toString(),
      fromTaluka: r.fromTaluka,
      fromDistrict: r.fromDistrict,
      toTaluka: r.toTaluka,
      toDistrict: r.toDistrict,
      distanceKm: r.distanceKm,
      createdAt: r.createdAt,
    })),
  });
}

/**
 * POST /api/sfa/expense-settings/routes
 * Create a new expense route
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fromTaluka, toTaluka, distanceKm } = body;

  if (!fromTaluka || !toTaluka) {
    return NextResponse.json(
      { error: "From and To talukas are required" },
      { status: 400 }
    );
  }

  if (!distanceKm || Number(distanceKm) <= 0) {
    return NextResponse.json({ error: "Valid distance is required" }, { status: 400 });
  }

  await connectToDatabase();

  // Find district for each taluka
  const fromTalukaData = await MasterItemModel.findOne({
    type: "taluka",
    name: fromTaluka,
  }).lean();

  const toTalukaData = await MasterItemModel.findOne({
    type: "taluka",
    name: toTaluka,
  }).lean();

  if (!fromTalukaData || !toTalukaData) {
    return NextResponse.json({ error: "Invalid taluka selected" }, { status: 400 });
  }

  // Check if route already exists
  const existing = await ExpenseRouteModel.findOne({
    fromTaluka,
    toTaluka,
    isActive: true,
  });

  if (existing) {
    return NextResponse.json(
      { error: `Route from ${fromTaluka} to ${toTaluka} already exists` },
      { status: 409 }
    );
  }

  const route = await ExpenseRouteModel.create({
    fromTaluka,
    fromDistrict: fromTalukaData.parent || "",
    toTaluka,
    toDistrict: toTalukaData.parent || "",
    distanceKm: Number(distanceKm),
    createdBy: {
      username: auth.session.username,
      name: auth.session.name,
    },
  });

  return NextResponse.json(
    {
      route: {
        _id: route._id?.toString(),
        fromTaluka: route.fromTaluka,
        fromDistrict: route.fromDistrict,
        toTaluka: route.toTaluka,
        toDistrict: route.toDistrict,
        distanceKm: route.distanceKm,
      },
    },
    { status: 201 }
  );
}
