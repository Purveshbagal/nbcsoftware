"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Allowance = {
  bikePerKm: number;
  carPerKm: number;
  publicTransportPerKm: number;
  headquarterAllowance: number;
  inCityAllowance: number;
  outstationAllowance: number;
};

type Route = {
  _id: string;
  fromTaluka: string;
  fromDistrict: string;
  toTaluka: string;
  toDistrict: string;
  distanceKm: number;
};

type Taluka = {
  name: string;
  district: string;
};

export default function ExpenseSettingsClient() {
  const [activeTab, setActiveTab] = useState<"allowance" | "routes">("allowance");

  // Allowance state
  const [allowance, setAllowance] = useState<Allowance>({
    bikePerKm: 0,
    carPerKm: 0,
    publicTransportPerKm: 0,
    headquarterAllowance: 0,
    inCityAllowance: 0,
    outstationAllowance: 0,
  });
  const [isSavingAllowance, setIsSavingAllowance] = useState(false);

  // Routes state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [newRoute, setNewRoute] = useState({
    fromTaluka: "",
    toTaluka: "",
    distanceKm: "",
  });

  // Load allowance settings
  useEffect(() => {
    fetch("/api/sfa/expense-settings/allowance")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setAllowance(data.settings);
        }
      })
      .catch((err) => console.error("Failed to load allowance:", err));
  }, []);

  // Load routes and talukas
  useEffect(() => {
    if (activeTab === "routes") {
      loadRoutes();
      loadTalukas();
    }
  }, [activeTab]);

  const loadRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const res = await fetch("/api/sfa/expense-settings/routes");
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error("Failed to load routes:", err);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const loadTalukas = async () => {
    try {
      const res = await fetch("/api/sfa/expense-settings/talukas");
      const data = await res.json();
      setTalukas(data.talukas || []);
    } catch (err) {
      console.error("Failed to load talukas:", err);
    }
  };

  const handleSaveAllowance = async () => {
    setIsSavingAllowance(true);
    try {
      const res = await fetch("/api/sfa/expense-settings/allowance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allowance),
      });

      if (res.ok) {
        alert("Allowance settings saved successfully");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error: Failed to save settings");
    } finally {
      setIsSavingAllowance(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!newRoute.fromTaluka || !newRoute.toTaluka || !newRoute.distanceKm) {
      alert("Error: All fields are required");
      return;
    }

    setIsCreatingRoute(true);
    try {
      const res = await fetch("/api/sfa/expense-settings/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromTaluka: newRoute.fromTaluka,
          toTaluka: newRoute.toTaluka,
          distanceKm: Number(newRoute.distanceKm),
        }),
      });

      if (res.ok) {
        alert("Route created successfully");
        setNewRoute({ fromTaluka: "", toTaluka: "", distanceKm: "" });
        loadRoutes();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error: Failed to create route");
    } finally {
      setIsCreatingRoute(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      const res = await fetch(`/api/sfa/expense-settings/routes/${routeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Route deleted successfully");
        loadRoutes();
      } else {
        alert("Error: Failed to delete route");
      }
    } catch (err) {
      alert("Error: Failed to delete route");
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Expense Settings</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "allowance"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("allowance")}
        >
          Add Allowance
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "routes"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("routes")}
        >
          Create Route
        </button>
      </div>

      {/* Allowance Tab */}
      {activeTab === "allowance" && (
        <div className="space-y-8">
          {/* Mode Section */}
          <div>
            <h2 className="mb-4 text-lg font-bold">Mode</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="bikePerKm">Bike per km (₹)</Label>
                <Input
                  id="bikePerKm"
                  type="number"
                  value={allowance.bikePerKm}
                  onChange={(e) =>
                    setAllowance({ ...allowance, bikePerKm: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="carPerKm">Car per km (₹)</Label>
                <Input
                  id="carPerKm"
                  type="number"
                  value={allowance.carPerKm}
                  onChange={(e) =>
                    setAllowance({ ...allowance, carPerKm: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="publicTransportPerKm">Public Transport per km (₹)</Label>
                <Input
                  id="publicTransportPerKm"
                  type="number"
                  value={allowance.publicTransportPerKm}
                  onChange={(e) =>
                    setAllowance({ ...allowance, publicTransportPerKm: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* Other Section */}
          <div>
            <h2 className="mb-4 text-lg font-bold">Other</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="headquarterAllowance">Headquarter (₹)</Label>
                <Input
                  id="headquarterAllowance"
                  type="number"
                  value={allowance.headquarterAllowance}
                  onChange={(e) =>
                    setAllowance({ ...allowance, headquarterAllowance: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="inCityAllowance">In City (₹)</Label>
                <Input
                  id="inCityAllowance"
                  type="number"
                  value={allowance.inCityAllowance}
                  onChange={(e) =>
                    setAllowance({ ...allowance, inCityAllowance: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="outstationAllowance">Outstation (₹)</Label>
                <Input
                  id="outstationAllowance"
                  type="number"
                  value={allowance.outstationAllowance}
                  onChange={(e) =>
                    setAllowance({ ...allowance, outstationAllowance: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveAllowance} disabled={isSavingAllowance}>
            {isSavingAllowance ? "Saving..." : "Save Allowance"}
          </Button>
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === "routes" && (
        <div className="space-y-6">
          {/* Create Route Form */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-bold">Create New Route</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="fromTaluka">From Taluka</Label>
                <Select
                  value={newRoute.fromTaluka}
                  onValueChange={(value) => setNewRoute({ ...newRoute, fromTaluka: value ?? "" })}
                >
                  <SelectTrigger id="fromTaluka">
                    <SelectValue placeholder="Select taluka" />
                  </SelectTrigger>
                  <SelectContent>
                    {talukas.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name} ({t.district})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toTaluka">To Taluka</Label>
                <Select
                  value={newRoute.toTaluka}
                  onValueChange={(value) => setNewRoute({ ...newRoute, toTaluka: value ?? "" })}
                >
                  <SelectTrigger id="toTaluka">
                    <SelectValue placeholder="Select taluka" />
                  </SelectTrigger>
                  <SelectContent>
                    {talukas.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name} ({t.district})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="distanceKm">Distance (km)</Label>
                <Input
                  id="distanceKm"
                  type="number"
                  value={newRoute.distanceKm}
                  onChange={(e) => setNewRoute({ ...newRoute, distanceKm: e.target.value })}
                  placeholder="Enter distance"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateRoute} disabled={isCreatingRoute} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreatingRoute ? "Creating..." : "Create Route"}
                </Button>
              </div>
            </div>
          </div>

          {/* Routes List */}
          <div>
            <h2 className="mb-4 text-lg font-bold">Existing Routes</h2>
            {isLoadingRoutes ? (
              <p className="text-muted-foreground">Loading routes...</p>
            ) : routes.length === 0 ? (
              <p className="text-muted-foreground">No routes created yet.</p>
            ) : (
              <div className="space-y-2">
                {routes.map((route) => (
                  <div
                    key={route._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {route.fromTaluka} ({route.fromDistrict}) → {route.toTaluka} (
                        {route.toDistrict})
                      </p>
                      <p className="text-muted-foreground text-sm">{route.distanceKm} km</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRoute(route._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
