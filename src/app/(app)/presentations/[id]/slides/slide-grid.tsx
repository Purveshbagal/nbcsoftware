"use client";

import { Plus, Eye, X, ChevronLeft, ChevronRight, GripVertical, Save } from "lucide-react";
import { useState } from "react";

interface Slide {
  imageUrl?: string;
  imageData?: string;
  order: number;
  uploadedAt?: string;
  _id?: string;
}

interface Props {
  presentationId: string;
  initialSlides: Slide[];
}

export function SlideGrid({ presentationId, initialSlides }: Props) {
  const [slides, setSlides] = useState(initialSlides);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
          window.location.reload();
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

  const handlePreview = (index: number) => {
    setCurrentSlideIndex(index);
    setPreviewMode(true);
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...slides];
    const draggedSlide = newSlides[draggedIndex];
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedSlide);

    setSlides(newSlides);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      const updatedSlides = slides.map((slide, index) => ({
        ...slide,
        order: index + 1,
      }));

      const response = await fetch(`/api/presentations/${presentationId}/slides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: updatedSlides }),
      });

      if (response.ok) {
        alert("Order saved successfully!");
        setReorderMode(false);
        window.location.reload();
      } else {
        alert("Failed to save order");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error saving order");
    }
  };

  return (
    <>
      {/* Header with buttons */}
      <div className="mb-4 flex justify-end gap-2">
        {reorderMode ? (
          <>
            <button
              onClick={handleSaveOrder}
              className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
              Save Order
            </button>
            <button
              onClick={() => {
                setReorderMode(false);
                setSlides(initialSlides);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setReorderMode(true)}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Change Order
            </button>
            <button
              onClick={() => slides.length > 0 && handlePreview(0)}
              disabled={slides.length === 0}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </>
        )}
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {slides.map((slide, index) => (
          <div
            key={index}
            draggable={reorderMode}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md ${
              reorderMode ? "cursor-move" : ""
            }`}
          >
            {reorderMode && (
              <div className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm">
                <GripVertical className="h-5 w-5 text-gray-600" />
              </div>
            )}
            {!reorderMode && (
              <button
                onClick={() => handlePreview(index)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
            )}
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
        {!reorderMode && (
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
        )}
      </div>

      {/* Preview Modal */}
      {previewMode && slides.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => setPreviewMode(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {currentSlideIndex > 0 && (
            <button
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {currentSlideIndex < slides.length - 1 && (
            <button
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Slide */}
          <div className="max-h-[90vh] max-w-[90vw]">
            <img
              src={
                slides[currentSlideIndex].imageUrl ||
                `data:image/jpeg;base64,${slides[currentSlideIndex].imageData}`
              }
              alt={`Slide ${currentSlideIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>

          {/* Slide counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-white">
            {currentSlideIndex + 1} / {slides.length}
          </div>
        </div>
      )}
    </>
  );
}
