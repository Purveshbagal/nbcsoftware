import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import PresentationModel from "@/models/Presentation";

/**
 * GET all presentations (admin)
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const presentations = await PresentationModel.find()
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ presentations });
}

/**
 * POST create new presentation (admin only)
 */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as
    | {
        title?: string;
        description?: string;
        fileUrl?: string;
        fileType?: string;
        fileName?: string;
        fileSize?: number;
        category?: string;
        products?: string[];
        division?: string;
        isActive?: boolean;
      }
    | null;

  if (!body?.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!body?.fileUrl) {
    return NextResponse.json({ error: "File URL is required" }, { status: 400 });
  }

  await connectToDatabase();

  const presentation = await PresentationModel.create({
    title: body.title,
    description: body.description || "",
    fileUrl: body.fileUrl,
    fileType: body.fileType || "pdf",
    fileName: body.fileName || "",
    fileSize: body.fileSize || 0,
    category: body.category || "",
    products: body.products || [],
    division: body.division || "",
    isActive: body.isActive !== false,
    publishedAt: body.isActive !== false ? new Date() : undefined,
    createdBy: { username: session.username, name: session.name },
  });

  return NextResponse.json({ presentation });
}

/**
 * DELETE presentation (admin only)
 */
export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await connectToDatabase();

  await PresentationModel.findByIdAndUpdate(id, { isActive: false });

  return NextResponse.json({ ok: true });
}

/**
 * PUT update presentation (admin only)
 */
export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as
    | {
        id?: string;
        title?: string;
        description?: string;
        fileUrl?: string;
        fileType?: string;
        fileName?: string;
        fileSize?: number;
        category?: string;
        products?: string[];
        division?: string;
        isActive?: boolean;
      }
    | null;

  if (!body?.id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await connectToDatabase();

  const presentation = await PresentationModel.findById(body.id);

  if (!presentation) {
    return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
  }

  // Update fields
  if (body.title !== undefined) presentation.title = body.title;
  if (body.description !== undefined) presentation.description = body.description;
  if (body.fileUrl !== undefined) presentation.fileUrl = body.fileUrl;
  if (body.fileType !== undefined) presentation.fileType = body.fileType;
  if (body.fileName !== undefined) presentation.fileName = body.fileName;
  if (body.fileSize !== undefined) presentation.fileSize = body.fileSize;
  if (body.category !== undefined) presentation.category = body.category;
  if (body.products !== undefined) presentation.products = body.products;
  if (body.division !== undefined) presentation.division = body.division;
  if (body.isActive !== undefined) {
    presentation.isActive = body.isActive;
    if (body.isActive && !presentation.publishedAt) {
      presentation.publishedAt = new Date();
    }
  }

  presentation.updatedBy = { username: session.username, name: session.name };

  await presentation.save();

  return NextResponse.json({ presentation });
}
