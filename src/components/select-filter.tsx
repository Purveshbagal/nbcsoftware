"use client";

import { useRouter } from "next/navigation";

type SelectFilterProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  basePath: string;
  currentParams: Record<string, string | undefined>;
  paramName: string;
};

export function SelectFilter({
  label,
  value,
  options,
  basePath,
  currentParams,
  paramName,
}: SelectFilterProps) {
  const router = useRouter();

  const handleChange = (newValue: string) => {
    const params = new URLSearchParams();

    // Add all current params except the one we're changing
    Object.entries(currentParams).forEach(([key, val]) => {
      if (key !== paramName && val) {
        params.set(key, val);
      }
    });

    // Add the new value if it's not "all"
    if (newValue !== "all") {
      params.set(paramName, newValue);
    }

    const query = params.toString();
    router.push(`${basePath}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        className="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
