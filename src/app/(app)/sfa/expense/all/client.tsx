"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Clock, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Expense = {
  _id: string;
  employeeId: string;
  employeeName: string;
  zone: string;
  division: string;
  designation: string;
  expenseDate: string;
  workPlan: string;
  fromTaluka: string;
  fromDistrict: string;
  toTaluka: string;
  toDistrict: string;
  distanceKm: number;
  travelMode: string;
  arrivalStatus: string;
  arrivedAt: string | null;
  arrivalLocation: {
    lat: number;
    lng: number;
    address?: string;
    area?: string;
    village?: string;
    district?: string;
  } | null;
  travelTimeMinutes: number;
  travelAllowance: number;
  workPlanAllowance: number;
  requestedExpenses: number;
  totalAmount: number;
  paymentStatus: string;
  punchedInAt: string | null;
};

export default function AllExpenseClient({ expenses }: { expenses: Expense[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWorkPlan, setFilterWorkPlan] = useState<string>("all");
  const [filterArrival, setFilterArrival] = useState<string>("all");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWorkPlan = filterWorkPlan === "all" || exp.workPlan === filterWorkPlan;
    const matchesArrival =
      filterArrival === "all" ||
      (filterArrival === "arrived" && exp.arrivalStatus === "arrived") ||
      (filterArrival === "not-arrived" && exp.arrivalStatus === "not-arrived");

    return matchesSearch && matchesWorkPlan && matchesArrival;
  });

  const handleShowDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetails(true);
  };

  const getWorkPlanLabel = (workPlan: string) => {
    const labels: Record<string, string> = {
      headquarter: "Headquarter",
      "in-city": "In City",
      outstation: "Outstation",
    };
    return labels[workPlan] || workPlan;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      bike: "Bike",
      car: "Car",
      "public-transport": "Public Transport",
    };
    return labels[mode] || mode;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">All Expenses</h1>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div>
          <Input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={filterWorkPlan} onValueChange={(val) => setFilterWorkPlan(val ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Work Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Plans</SelectItem>
              <SelectItem value="headquarter">Headquarter</SelectItem>
              <SelectItem value="in-city">In City</SelectItem>
              <SelectItem value="outstation">Outstation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filterArrival} onValueChange={(val) => setFilterArrival(val ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Arrival Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="arrived">Arrived</SelectItem>
              <SelectItem value="not-arrived">Not Arrived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-muted-foreground text-sm">
          Total: {filteredExpenses.length} expenses
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No expenses found</p>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense._id}
              className="rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleShowDetails(expense)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold">{expense.employeeName}</h3>
                    <span className="text-muted-foreground text-sm">
                      {expense.designation && `• ${expense.designation}`}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                    </span>
                  </div>

                  {/* Work Plan & Route */}
                  <div className="mb-2 flex items-center gap-4 text-sm">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                      {getWorkPlanLabel(expense.workPlan)}
                    </span>
                    {expense.workPlan === "outstation" && (
                      <>
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {expense.fromTaluka} → {expense.toTaluka}
                          </span>
                          <span className="text-muted-foreground">
                            ({expense.distanceKm} km)
                          </span>
                        </div>
                        {expense.travelMode && (
                          <span className="text-muted-foreground">
                            • {getModeLabel(expense.travelMode)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-sm">
                    <span className="font-semibold">Total: ₹{expense.totalAmount}</span>
                    <span className="text-muted-foreground ml-2">
                      (Travel: ₹{expense.travelAllowance} + Work Plan: ₹
                      {expense.workPlanAllowance}
                      {expense.requestedExpenses > 0 &&
                        ` + Requests: ₹${expense.requestedExpenses}`}
                      )
                    </span>
                  </div>
                </div>

                {/* Arrival Status */}
                <div className="text-right">
                  {expense.workPlan === "outstation" ? (
                    expense.arrivalStatus === "arrived" ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <div className="h-2 w-2 rounded-full bg-green-600" />
                        Arrived
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        <div className="h-2 w-2 rounded-full bg-red-600" />
                        Not Arrived
                      </div>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                      Auto Arrived
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Employee</p>
                  <p className="font-medium">{selectedExpense.employeeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedExpense.expenseDate), "dd MMMM yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Zone</p>
                  <p className="font-medium">{selectedExpense.zone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Division</p>
                  <p className="font-medium">{selectedExpense.division || "-"}</p>
                </div>
              </div>

              <hr />

              {/* Work Plan Details */}
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Work Plan</p>
                <p className="font-medium">{getWorkPlanLabel(selectedExpense.workPlan)}</p>
              </div>

              {/* Route Details (Outstation only) */}
              {selectedExpense.workPlan === "outstation" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">From</p>
                      <p className="font-medium">
                        {selectedExpense.fromTaluka}
                        {selectedExpense.fromDistrict && ` (${selectedExpense.fromDistrict})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">To</p>
                      <p className="font-medium">
                        {selectedExpense.toTaluka}
                        {selectedExpense.toDistrict && ` (${selectedExpense.toDistrict})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Distance</p>
                      <p className="font-medium">{selectedExpense.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Travel Mode</p>
                      <p className="font-medium">
                        {selectedExpense.travelMode
                          ? getModeLabel(selectedExpense.travelMode)
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Arrival Information */}
                  {selectedExpense.arrivalStatus === "arrived" && (
                    <>
                      <hr />
                      <div>
                        <p className="text-muted-foreground mb-2 text-sm font-semibold">
                          Arrival Information
                        </p>
                        <div className="space-y-2">
                          {selectedExpense.punchedInAt && (
                            <div className="flex items-start gap-2">
                              <Clock className="mt-1 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Started (Punch In)</p>
                                <p className="text-muted-foreground text-sm">
                                  {format(new Date(selectedExpense.punchedInAt), "dd MMM yyyy, hh:mm a")}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Arrival Location</p>
                              {selectedExpense.arrivalLocation ? (
                                <>
                                  {(selectedExpense.arrivalLocation.area ||
                                    selectedExpense.arrivalLocation.village ||
                                    selectedExpense.arrivalLocation.district) && (
                                    <p className="text-muted-foreground text-sm">
                                      {[
                                        selectedExpense.arrivalLocation.area,
                                        selectedExpense.arrivalLocation.village,
                                        selectedExpense.arrivalLocation.district,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  )}
                                  {selectedExpense.arrivalLocation.address && (
                                    <p className="text-muted-foreground text-sm">
                                      {selectedExpense.arrivalLocation.address}
                                    </p>
                                  )}
                                  <a
                                    className="text-sm text-blue-600 underline"
                                    href={`https://www.google.com/maps?q=${selectedExpense.arrivalLocation.lat},${selectedExpense.arrivalLocation.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {selectedExpense.arrivalLocation.lat.toFixed(5)},{" "}
                                    {selectedExpense.arrivalLocation.lng.toFixed(5)} · Open in Maps
                                  </a>
                                </>
                              ) : (
                                <p className="text-muted-foreground text-sm">Location not available</p>
                              )}
                            </div>
                          </div>
                          {selectedExpense.arrivedAt && (
                            <div className="flex items-start gap-2">
                              <Clock className="mt-1 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Arrived At</p>
                                <p className="text-muted-foreground text-sm">
                                  {format(new Date(selectedExpense.arrivedAt), "dd MMM yyyy, hh:mm a")}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedExpense.travelTimeMinutes > 0 && (
                            <div className="flex items-start gap-2">
                              <Clock className="mt-1 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Time Taken to Reach</p>
                                <p className="text-muted-foreground text-sm">
                                  {Math.floor(selectedExpense.travelTimeMinutes / 60)}h{" "}
                                  {selectedExpense.travelTimeMinutes % 60}m
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <hr />

              {/* Amount Breakdown */}
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-semibold">Amount Breakdown</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Travel Allowance</span>
                    <span className="font-medium">₹{selectedExpense.travelAllowance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Plan Allowance</span>
                    <span className="font-medium">₹{selectedExpense.workPlanAllowance}</span>
                  </div>
                  {selectedExpense.requestedExpenses > 0 && (
                    <div className="flex justify-between">
                      <span>Requested Expenses</span>
                      <span className="font-medium">₹{selectedExpense.requestedExpenses}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>₹{selectedExpense.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
