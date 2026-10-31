import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import MediaAssetModel from "@/models/MediaAsset";

/**
 * Get active presentations for mobile app
 * Uses MediaAsset model with kind="presentation" (same as Racer NBC)
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) {
    return auth.error;
  }

  await connectToDatabase();

  // Fetch presentations from MediaAsset collection (kind="presentation")
  const presentations = await MediaAssetModel.find({
    kind: "presentation",
    isActive: true
  })
    .sort({ createdAt: -1 })
    .select("title description url fileType division campaign")
    .limit(50)
    .lean();

  // Transform the response to match mobile app expectations
  const transformedPresentations = presentations.map((p) => ({
    _id: p._id,
    title: p.title,
    description: p.description,
    fileUrl: p.url,
    fileType: p.fileType,
    division: p.division,
    campaign: p.campaign,
  }));

  return NextResponse.json({ presentations: transformedPresentations });
}
