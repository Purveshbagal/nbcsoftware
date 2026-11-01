"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Village = {
  _id: string;
  name: string;
};

export default function VillagesPage() {
  const params = useParams();
  const districtName = decodeURIComponent(params.district as string);
  const talukaName = decodeURIComponent(params.taluka as string);

  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadVillages();
  }, []);

  const loadVillages = async () => {
    try {
      const response = await fetch(
        `/api/sfa/masters/locations?type=village&parent=${encodeURIComponent(talukaName)}`
      );
      const data = await response.json();
      const villageArray = data.options.map((opt: any, idx: number) => ({
        _id: idx.toString(),
        name: opt.name,
      }));
      setVillages(villageArray);
    } catch (error) {
      console.error("Failed to load villages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (villageName: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${villageName}"?`
    );

    if (!confirmed) return;

    setDeleting(villageName);
    try {
      const response = await fetch(
        `/api/sfa/locations/delete?type=village&name=${encodeURIComponent(villageName)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete village");
      }

      const data = await response.json();
      alert(data.message);
      loadVillages(); // Reload the list
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading villages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="mb-2 flex flex-col gap-1">
        <Link
          href="/sfa/locations/districts"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← All Districts
        </Link>
        <Link
          href={`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas`}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 ml-4"
        >
          ← Back to Talukas in {districtName}
        </Link>
      </div>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Villages in {talukaName}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage villages in {talukaName} taluka, {districtName} district.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Villages</h2>
          <Link
            href={`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas/${encodeURIComponent(talukaName)}/villages/add`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Village
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {villages.map((village) => (
            <div
              key={village.name}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {village.name}
                    </h3>
                    <p className="text-xs text-gray-500">Village</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(village.name)}
                  disabled={deleting === village.name}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Delete Village"
                >
                  {deleting === village.name ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
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

        {villages.length === 0 && (
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No villages found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new village in {talukaName} taluka.
            </p>
            <div className="mt-6">
              <Link
                href={`/sfa/locations/districts/${encodeURIComponent(districtName)}/talukas/${encodeURIComponent(talukaName)}/villages/add`}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                + Add Village
              </Link>
            </div>
          </div>
        )}

        {villages.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Total {villages.length} village{villages.length !== 1 ? "s" : ""} in {talukaName}
          </div>
        )}
      </div>
    </div>
  );
}
