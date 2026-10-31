import { connectToDatabase } from "@/lib/mongodb";
import PresentationModel from "@/models/Presentation";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddSlideButton } from "./add-slide-button";
import { SlideGrid } from "./slide-grid";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PresentationSlidesPage({ params }: Props) {
  // Await params in Next.js 15
  const { id } = await params;

  await connectToDatabase();

  const presentation = await PresentationModel.findById(id).lean();

  if (!presentation) {
    notFound();
  }

  // Convert MongoDB objects to plain JavaScript objects
  const plainSlides = (presentation.slides || []).map((slide: any) => ({
    imageUrl: slide.imageUrl || "",
    imageData: slide.imageData || "",
    order: slide.order || 0,
    uploadedAt: slide.uploadedAt ? slide.uploadedAt.toISOString() : new Date().toISOString(),
    _id: slide._id ? slide._id.toString() : "",
  }));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/presentations"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              Presentation : {presentation.title}
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
              Change Order
            </button>
            <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Slides Grid */}
      <div className="flex-1 p-6">
        <SlideGrid presentationId={id} initialSlides={plainSlides} />
      </div>
    </div>
  );
}
