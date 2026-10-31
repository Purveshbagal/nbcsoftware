import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import PresentationModel from "@/models/Presentation";

/**
 * Get active presentations for mobile app
 * Uses new Presentation model matching screenshot structure
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) {
    return auth.error;
  }

  const { employee } = auth;

  await connectToDatabase();

  // Fetch presentations assigned to this employee or their division
  const presentations = await PresentationModel.find({
    isActive: true,
    $or: [
      { assignedTo: employee.name },
      { assignedToId: employee._id?.toString() },
      { division: employee.division },
      { assigningType: "Employee" }, // All employee presentations
    ]
  })
    .sort({ date: -1, createdAt: -1 })
    .select("title description assigningType assignedTo division date coverImage slides")
    .limit(50)
    .lean();

  // Transform the response to match mobile app expectations
  const transformedPresentations = presentations.map((p) => ({
    _id: p._id,
    title: p.title,
    description: p.description,
    assigningType: p.assigningType,
    assignedTo: p.assignedTo,
    division: p.division,
    date: p.date,
    coverImage: p.coverImage,
    slides: p.slides || [],
    slidesCount: p.slides?.length || 0,
  }));

  return NextResponse.json({ presentations: transformedPresentations });
}
