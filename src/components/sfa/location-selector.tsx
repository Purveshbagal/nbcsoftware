"use client";

import { useEffect, useState } from "react";

type LocationSelectorProps = {
  stateValue?: string;
  districtValue?: string;
  talukaValue?: string;
  villageValue?: string;
  onStateChange?: (value: string) => void;
  onDistrictChange?: (value: string) => void;
  onTalukaChange?: (value: string) => void;
  onVillageChange?: (value: string) => void;
};

export function LocationSelector({
  stateValue = "Maharashtra",
  districtValue = "",
  talukaValue = "",
  villageValue = "",
  onStateChange,
  onDistrictChange,
  onTalukaChange,
  onVillageChange,
}: LocationSelectorProps) {
  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState(stateValue);
  const [selectedDistrict, setSelectedDistrict] = useState(districtValue);
  const [selectedTaluka, setSelectedTaluka] = useState(talukaValue);
  const [selectedVillage, setSelectedVillage] = useState(villageValue);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState) {
      loadDistricts();
    }
  }, [selectedState]);

  // Load talukas when district changes
  useEffect(() => {
    if (selectedDistrict) {
      loadTalukas();
    } else {
      setTalukas([]);
      setSelectedTaluka("");
      setSelectedVillage("");
    }
  }, [selectedDistrict]);

  // Load villages when taluka changes
  useEffect(() => {
    if (selectedTaluka) {
      loadVillages();
    } else {
      setVillages([]);
      setSelectedVillage("");
    }
  }, [selectedTaluka]);

  const loadDistricts = async () => {
    try {
      const response = await fetch(
        `/api/sfa/masters/locations?type=district&parent=${encodeURIComponent(selectedState)}`
      );
      const data = await response.json();
      setDistricts(data.options.map((opt: any) => opt.name));
    } catch (error) {
      console.error("Failed to load districts:", error);
      setDistricts([]);
    }
  };

  const loadTalukas = async () => {
    try {
      const response = await fetch(
        `/api/sfa/masters/locations?type=taluka&parent=${encodeURIComponent(selectedDistrict)}`
      );
      const data = await response.json();
      setTalukas(data.options.map((opt: any) => opt.name));
    } catch (error) {
      console.error("Failed to load talukas:", error);
      setTalukas([]);
    }
  };

  const loadVillages = async () => {
    try {
      const response = await fetch(
        `/api/sfa/masters/locations?type=village&parent=${encodeURIComponent(selectedTaluka)}`
      );
      const data = await response.json();
      setVillages(data.options.map((opt: any) => opt.name));
    } catch (error) {
      console.error("Failed to load villages:", error);
      setVillages([]);
    }
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict("");
    setSelectedTaluka("");
    setSelectedVillage("");
    setDistricts([]);
    setTalukas([]);
    setVillages([]);
    onStateChange?.(value);
    onDistrictChange?.("");
    onTalukaChange?.("");
    onVillageChange?.("");
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedTaluka("");
    setSelectedVillage("");
    setTalukas([]);
    setVillages([]);
    onDistrictChange?.(value);
    onTalukaChange?.("");
    onVillageChange?.("");
  };

  const handleTalukaChange = (value: string) => {
    setSelectedTaluka(value);
    setSelectedVillage("");
    setVillages([]);
    onTalukaChange?.(value);
    onVillageChange?.("");
  };

  const handleVillageChange = (value: string) => {
    setSelectedVillage(value);
    onVillageChange?.(value);
  };

  return (
    <div className="space-y-4">
      {/* State */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State
        </label>
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Maharashtra">Maharashtra</option>
        </select>
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          District
        </label>
        <select
          value={selectedDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={districts.length === 0}
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      {/* Taluka */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Taluka
        </label>
        <select
          value={selectedTaluka}
          onChange={(e) => handleTalukaChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={!selectedDistrict || talukas.length === 0}
        >
          <option value="">Select Taluka</option>
          {talukas.map((taluka) => (
            <option key={taluka} value={taluka}>
              {taluka}
            </option>
          ))}
        </select>
      </div>

      {/* Village */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Village
        </label>
        <select
          value={selectedVillage}
          onChange={(e) => handleVillageChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={!selectedTaluka || villages.length === 0}
        >
          <option value="">Select Village</option>
          {villages.map((village) => (
            <option key={village} value={village}>
              {village}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
