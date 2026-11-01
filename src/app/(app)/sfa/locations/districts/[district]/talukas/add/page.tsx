"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AddTalukaPage() {
  const router = useRouter();
  const params = useParams();
  const districtName = decodeURIComponent(params.district as string);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Taluka name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/sfa/masters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "taluka",
          name: name.trim(),
          parent: districtName,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add taluka");
      }

      router.push(`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back to Talukas
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Add New Taluka</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Taluka Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter taluka name (e.g., Haveli, Mulshi)"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>District:</strong> {districtName}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This taluka will be added under {districtName} district.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "Adding..." : "Add Taluka"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
