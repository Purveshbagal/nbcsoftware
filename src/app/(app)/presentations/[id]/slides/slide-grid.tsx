"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface Slide {
  imageUrl?: string;
  imageData?: string;
  order: number;
  uploadedAt?: Date;
}

interface Props {
  presentationId: string;
  initialSlides: Slide[];
}

export function SlideGrid({ presentationId, initialSlides }: Props) {
  const [slides, setSlides] = useState(initialSlides);
  const [uploading, setUploading] = useState(false);

  const handleAddSlide = async () => {
    // Create file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setUploading(true);

      try {
        const newSlides = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const reader = new FileReader();

          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]); // Remove data:image/jpeg;base64, prefix
            };
            reader.readAsDataURL(file);
          });

          newSlides.push({
            imageData: base64,
            order: slides.length + i + 1,
          });
        }

        // Upload to API
        const response = await fetch(`/api/presentations/${presentationId}/slides`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slides: newSlides }),
        });

        if (response.ok) {
          const data = await response.json();
          setSlides(data.slides || []);
          alert("Slides added successfully!");
        } else {
          alert("Failed to add slides");
        }
      } catch (error) {
        console.error("Error uploading slides:", error);
        alert("Error uploading slides");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  return (
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
              className="h-64 w-full object-contain bg-white"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gray-100 text-gray-400">
              No Image
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
            <p className="text-sm font-medium text-white">Slide {index + 1}</p>
          </div>
        </div>
      ))}

      {/* Add Slide Button */}
      <button
        onClick={handleAddSlide}
        disabled={uploading}
        className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Plus className="h-8 w-8" />
        </div>
        <span className="text-lg font-medium">
          {uploading ? "Uploading..." : "Add Slide"}
        </span>
      </button>
    </div>
  );
}
