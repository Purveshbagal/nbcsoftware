"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Taluka = {
  _id: string;
  name: string;
};

export default function TalukasPage() {
  const params = useParams();
  const districtName = decodeURIComponent(params.district as string);

  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTalukas();
  }, []);

  const loadTalukas = async () => {
    try {
      const response = await fetch(
        `/api/sfa/masters/locations?type=taluka&parent=${encodeURIComponent(districtName)}`
      );
      const data = await response.json();
      const talukaArray = data.options.map((opt: any, idx: number) => ({
        _id: idx.toString(),
        name: opt.name,
      }));
      setTalukas(talukaArray);
    } catch (error) {
      console.error("Failed to load talukas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (talukaName: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${talukaName}"?\n\n⚠️ WARNING: This will also delete ALL villages in this taluka!`
    );

    if (!confirmed) return;

    setDeleting(talukaName);
    try {
      const response = await fetch(
        `/api/sfa/locations/delete?type=taluka&name=${encodeURIComponent(talukaName)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete taluka");
      }

      const data = await response.json();
      alert(data.message);
      loadTalukas(); // Reload the list
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading talukas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="mb-2">
        <Link
          href="/sfa/locations/districts"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back to Districts
        </Link>
      </div>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Talukas in {districtName}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Select a taluka to manage its villages. Click 'Add Taluka' to create a new taluka.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Talukas</h2>
          <Link
            href={`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas/add`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Taluka
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talukas.map((taluka) => (
            <div
              key={taluka.name}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas/${encodeURIComponent(taluka.name)}/villages`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {taluka.name}
                    </h3>
                    <p className="text-sm text-gray-500">Click to view villages</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(taluka.name)}
                  disabled={deleting === taluka.name}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Taluka"
                >
                  {deleting === taluka.name ? (
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

        {talukas.length === 0 && (
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
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No talukas found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new taluka in {districtName}.
            </p>
            <div className="mt-6">
              <Link
                href={`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas/add`}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                + Add Taluka
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
