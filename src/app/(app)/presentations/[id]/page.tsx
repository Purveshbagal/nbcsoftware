import { connectToDatabase } from "@/lib/mongodb";
import PresentationModel from "@/models/Presentation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function PresentationGalleryPage({ params }: Props) {
  await connectToDatabase();

  const presentation = await PresentationModel.findById(params.id).lean();

  if (!presentation) {
    notFound();
  }

  const slides = presentation.slides || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/presentations"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Presentation Title */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Presentation : {presentation.title}
        </h1>
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {slide.imageUrl || slide.imageData ? (
              <img
                src={slide.imageUrl || `data:image/jpeg;base64,${slide.imageData}`}
                alt={`Slide ${index + 1}`}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-gray-400">
                No Image
              </div>
            )}
          </div>
        ))}

        {/* Add Slide Button */}
        <button
          className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => alert("Add Slide functionality - to be implemented")}
        >
          <Plus className="h-12 w-12" />
          <span className="text-lg font-medium">Add Slide</span>
        </button>
      </div>

      {/* Presentation Details */}
      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Presentation Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Assigned Type:</span>
            <span className="ml-2 text-gray-600">{presentation.assigningType || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Assigned To:</span>
            <span className="ml-2 text-gray-600">{presentation.assignedTo || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Division:</span>
            <span className="ml-2 text-gray-600">{presentation.division || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Date:</span>
            <span className="ml-2 text-gray-600">
              {presentation.date ? new Date(presentation.date).toLocaleDateString() : "N/A"}
            </span>
          </div>
          {presentation.description && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">Description:</span>
              <p className="mt-1 text-gray-600">{presentation.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
