"use client";

import { MoreVertical, Eye, Edit, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Presentation {
  _id: string;
  title: string;
  assigningType?: string;
  assignedTo?: string;
  division?: string;
  date?: Date | string;
  description?: string;
  coverImage?: string;
  slides?: any[];
}

interface Props {
  presentations: Presentation[];
}

export function PresentationCards({ presentations }: Props) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/presentations?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Presentation deleted successfully");
        window.location.reload();
      } else {
        alert("Failed to delete presentation");
      }
    } catch (error) {
      console.error("Error deleting presentation:", error);
      alert("Error deleting presentation");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {presentations.map((presentation) => (
        <div
          key={presentation._id}
          className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Three-dot menu */}
          <div className="absolute right-2 top-2 z-10">
            <button
              onClick={() =>
                setMenuOpen(menuOpen === presentation._id ? null : presentation._id)
              }
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm hover:bg-white hover:text-gray-900"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen === presentation._id && (
              <div className="absolute right-0 top-10 w-48 rounded-lg border bg-white shadow-lg">
                <Link
                  href={`/presentations/${presentation._id}/slides`}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
                <button
                  onClick={() => alert("Edit functionality - to be implemented")}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(presentation._id, presentation.title)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={() => alert("Report functionality - to be implemented")}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  Report
                </button>
              </div>
            )}
          </div>

          {/* Cover Image */}
          <div className="relative h-48 w-full overflow-hidden bg-gray-100">
            {presentation.coverImage ? (
              <img
                src={presentation.coverImage}
                alt={presentation.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 mb-2" />
                  <p className="text-sm">No Image</p>
                </div>
              </div>
            )}
            {presentation.assigningType && (
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                {presentation.assigningType === "Doctor" ? "🩺 Pedia" : "👤 NBC Pedia"}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Name :</span>
                <span className="text-gray-900">{presentation.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Assigning Type :</span>
                <span className="text-gray-900">{presentation.assigningType || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Assigning To :</span>
                <span className="text-gray-900">{presentation.assignedTo || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Division :</span>
                <span className="text-gray-900">{presentation.division || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Date :</span>
                <span className="text-gray-900">
                  {presentation.date
                    ? new Date(presentation.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              {presentation.description && (
                <div className="pt-2">
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1 text-gray-600 line-clamp-2">{presentation.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
