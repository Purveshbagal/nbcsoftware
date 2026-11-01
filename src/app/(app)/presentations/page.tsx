import { PageHeader } from "@/components/sfa/page-header";
import { loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import PresentationModel from "@/models/Presentation";
import { PresentationCards } from "./presentation-cards";
import { AddPresentationButton } from "./add-presentation-button";

export default async function PresentationPage() {
  await connectToDatabase();

  const [presentations, masters] = await Promise.all([
    PresentationModel.find({ isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean(),
    loadMasterOptions(["division"]),
  ]);

  // Add PEDIA and DERMA to divisions if not already present
  const allDivisions = ["PEDIA", "DERMA", ...(masters.division || [])].filter(
    (div, index, self) => self.indexOf(div) === index
  );

  // Convert MongoDB documents to plain objects
  const plainPresentations = presentations.map((p) => ({
    _id: p._id.toString(),
    title: p.title || "",
    assigningType: p.assigningType || "",
    assignedTo: p.assignedTo || "",
    division: p.division || "",
    date: p.date ? p.date.toISOString() : "",
    description: p.description || "",
    coverImage: p.coverImage || "",
    slides: (p.slides || []).map((slide: any) => ({
      imageUrl: slide.imageUrl || "",
      imageData: slide.imageData || "",
      order: slide.order || 0,
      uploadedAt: slide.uploadedAt ? slide.uploadedAt.toISOString() : "",
      _id: slide._id ? slide._id.toString() : "",
    })),
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Presentation</h1>
        <div className="flex gap-2">
          <AddPresentationButton divisions={allDivisions} />
          <button className="flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            <span>▼</span>
            Advance Filters
          </button>
        </div>
      </div>

      <PresentationCards presentations={plainPresentations} />
    </div>
  );
}
