"use client";

import { useState } from "react";
import { Check, X, Calendar, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdvanceRequest = {
  _id: string;
  employeeId: string;
  employeeName: string;
  zone: string;
  division: string;
  requestDate: string;
  advanceAmount: number;
  reason: string;
  hasInstallment: boolean;
  installmentPerMonth: number;
  numberOfMonths: number;
  status: string;
  reviewedBy: { username: string; name: string } | null;
  reviewedAt: string | null;
  rejectionReason: string;
  createdAt: string;
};

export default function AdvanceRequestClient({
  requests: initialRequests,
}: {
  requests: AdvanceRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<AdvanceRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (requestId: string) => {
    if (!confirm("Approve this advance request?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/sfa/hr/advance-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (res.ok) {
        alert("Request approved successfully");
        setRequests((prev) =>
          prev.map((req) => (req._id === requestId ? { ...req, status: "approved" } : req))
        );
        setShowDetails(false);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error: Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/sfa/hr/advance-requests/${selectedRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectionReason }),
      });

      if (res.ok) {
        alert("Request rejected");
        setRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequest._id
              ? { ...req, status: "rejected", rejectionReason }
              : req
          )
        );
        setShowRejectDialog(false);
        setShowDetails(false);
        setRejectionReason("");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Error: Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalAmount: requests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + r.advanceAmount, 0),
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Advance Requests</h1>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Requests</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-amber-50 p-4">
          <p className="text-amber-700 text-sm">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-green-700 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="rounded-lg border bg-red-50 p-4">
          <p className="text-red-700 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-blue-700 text-sm">Total Approved</p>
          <p className="text-2xl font-bold text-blue-700">₹{stats.totalAmount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div>
          <Input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? "pending")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No requests found</p>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request._id}
              className="rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => {
                setSelectedRequest(request);
                setShowDetails(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold">{request.employeeName}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadge(request.status)}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-blue-600">
                        ₹{request.advanceAmount}
                      </span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    {request.hasInstallment && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {request.numberOfMonths} months × ₹{request.installmentPerMonth}
                        </span>
                      </>
                    )}
                  </div>

                  {request.reason && (
                    <p className="text-muted-foreground text-sm line-clamp-1">{request.reason}</p>
                  )}
                </div>

                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(request._id);
                      }}
                      disabled={isProcessing}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                        setShowRejectDialog(true);
                      }}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advance Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Employee</p>
                  <p className="font-medium">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Request Date</p>
                  <p className="font-medium">
                    {new Date(selectedRequest.requestDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Advance Amount</p>
                  <p className="text-lg font-bold text-blue-600">₹{selectedRequest.advanceAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Installment</p>
                  <p className="font-medium">
                    {selectedRequest.hasInstallment
                      ? `Yes - ${selectedRequest.numberOfMonths} months`
                      : "No"}
                  </p>
                </div>
              </div>

              {selectedRequest.hasInstallment && (
                <div>
                  <p className="text-muted-foreground text-sm">Per Month Deduction</p>
                  <p className="font-medium">₹{selectedRequest.installmentPerMonth}</p>
                </div>
              )}

              {selectedRequest.reason && (
                <div>
                  <p className="text-muted-foreground text-sm">Reason</p>
                  <p className="font-medium">{selectedRequest.reason}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusBadge(selectedRequest.status)}`}
                >
                  {selectedRequest.status}
                </span>
              </div>

              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                <div>
                  <p className="text-muted-foreground text-sm">Rejection Reason</p>
                  <p className="font-medium text-red-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={isProcessing}
                  >
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Please provide a reason for rejecting this request
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
