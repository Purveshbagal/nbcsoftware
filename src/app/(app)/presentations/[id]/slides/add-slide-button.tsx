"use client";

import { Plus } from "lucide-react";

export function AddSlideButton() {
  return (
    <button className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Plus className="h-8 w-8" />
      </div>
      <span className="text-lg font-medium">Add Slide</span>
    </button>
  );
}
