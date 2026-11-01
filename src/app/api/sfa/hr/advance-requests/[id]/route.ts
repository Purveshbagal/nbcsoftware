import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/sfa-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import AdvanceRequestModel from "@/models/AdvanceRequest";

/**
 * PATCH /api/sfa/hr/advance-requests/[id]
 * Approve or reject advance request
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { status, rejectionReason } = body;

  if (!status || !["approved", "rejected"].includes(String(status))) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status === "rejected" && !rejectionReason) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  await connectToDatabase();

  const request_doc = await AdvanceRequestModel.findByIdAndUpdate(
    id,
    {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : undefined,
      reviewedBy: {
        username: auth.session.username,
        name: auth.session.name,
      },
      reviewedAt: new Date(),
    },
    { new: true }
  );

  if (!request_doc) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({
    request: {
      _id: request_doc._id?.toString(),
      status: request_doc.status,
    },
  });
}
