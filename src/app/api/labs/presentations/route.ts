import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { connectToDatabase } from "@/lib/mongodb";
import PresentationModel from "@/models/Presentation";

/**
 * Get active presentations for mobile app
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) {
    return auth.error;
  }

  await connectToDatabase();

  const presentations = await PresentationModel.find({ isActive: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .select("title description fileUrl fileType fileName products category")
    .limit(50)
    .lean();

  // Increment view count when accessed
  // Note: This is a simple implementation. In production, you might want to track individual views
  const now = new Date();
  for (const presentation of presentations) {
    await PresentationModel.updateOne(
      { _id: presentation._id },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: now },
      }
    );
  }

  return NextResponse.json({ presentations });
}
