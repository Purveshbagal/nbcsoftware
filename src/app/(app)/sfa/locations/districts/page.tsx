"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type District = {
  _id: string;
  name: string;
};

export default function DistrictsPage() {
  const router = useRouter();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      const response = await fetch("/api/sfa/masters/locations?type=district");
      const data = await response.json();
      // Convert to array with _id
      const districtArray = data.options.map((opt: any, idx: number) => ({
        _id: idx.toString(),
        name: opt.name,
      }));
      setDistricts(districtArray);
    } catch (error) {
      console.error("Failed to load districts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (districtName: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${districtName}"?\n\n⚠️ WARNING: This will also delete ALL talukas and villages in this district!`
    );

    if (!confirmed) return;

    setDeleting(districtName);
    try {
      const response = await fetch(
        `/api/sfa/locations/delete?type=district&name=${encodeURIComponent(districtName)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete district");
      }

      const data = await response.json();
      alert(data.message);
      loadDistricts(); // Reload the list
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading districts...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Set Village - Districts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Select a district to manage its talukas and villages. Click 'Add District' to create a new district.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Districts in Maharashtra</h2>
          <Link
            href="/sfa/locations/districts/add"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add District
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {districts.map((district) => (
            <div
              key={district.name}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/sfa/locations/districts/${encodeURIComponent(district.name)}/talukas`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {district.name}
                    </h3>
                    <p className="text-sm text-gray-500">Click to view talukas</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(district.name)}
                  disabled={deleting === district.name}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete District"
                >
                  {deleting === district.name ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {districts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No districts found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new district.</p>
            <div className="mt-6">
              <Link
                href="/sfa/locations/districts/add"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                + Add District
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
