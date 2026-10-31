import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json";
import PresentationModel from "@/models/Presentation";

interface Slide {
  imageUrl?: string;
  imageData?: string;
  order: number;
}

/**
 * POST - Add slides to presentation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15
  const { id } = await params;

  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await readJsonBody(request)) as
    | {
        slides?: Slide[];
      }
    | null;

  if (!body?.slides || body.slides.length === 0) {
    return NextResponse.json({ error: "No slides provided" }, { status: 400 });
  }

  await connectToDatabase();

  const presentation = await PresentationModel.findById(id);

  if (!presentation) {
    return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
  }

  // Add new slides to existing slides
  if (!presentation.slides) {
    presentation.slides = [];
  }

  presentation.slides.push(...body.slides.map(slide => ({
    ...slide,
    uploadedAt: new Date()
  })));

  // Update cover image if it's the first slide and no cover exists
  if (!presentation.coverImage && body.slides[0]) {
    const firstSlide = body.slides[0];
    if (firstSlide.imageData) {
      presentation.coverImage = `data:image/jpeg;base64,${firstSlide.imageData}`;
    } else if (firstSlide.imageUrl) {
      presentation.coverImage = firstSlide.imageUrl;
    }
  }

  presentation.updatedBy = { username: session.username, name: session.name };
  await presentation.save();

  return NextResponse.json({
    slides: presentation.slides,
    message: "Slides added successfully"
  });
}

/**
 * GET - Get all slides for a presentation
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15
  const { id } = await params;

  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const presentation = await PresentationModel.findById(id)
    .select("slides")
    .lean();

  if (!presentation) {
    return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
  }

  return NextResponse.json({ slides: presentation.slides || [] });
}

/**
 * DELETE - Remove a slide from presentation
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15
  const { id } = await params;

  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slideIndex = searchParams.get("index");

  if (slideIndex === null) {
    return NextResponse.json({ error: "Slide index required" }, { status: 400 });
  }

  await connectToDatabase();

  const presentation = await PresentationModel.findById(id);

  if (!presentation) {
    return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
  }

  if (!presentation.slides || presentation.slides.length === 0) {
    return NextResponse.json({ error: "No slides to delete" }, { status: 400 });
  }

  // Remove slide at index
  presentation.slides.splice(parseInt(slideIndex), 1);

  presentation.updatedBy = { username: session.username, name: session.name };
  await presentation.save();

  return NextResponse.json({
    slides: presentation.slides,
    message: "Slide deleted successfully"
  });
}
