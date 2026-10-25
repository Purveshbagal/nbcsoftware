"use client";

import { useEffect, useState } from "react";
import { Check, X, Eye, MapPin, Phone, Mail, Building2 } from "lucide-react";

type Doctor = {
  _id: string;
  uinId: string;
  name: string;
  contactNo: string;
  email: string;
  qualification: string;
  speciality: string;
  category: string;
  gender: string;
  hospitalName: string;
  hospitalAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
  };
  documents: string[];
  createdBy: {
    username: string;
    name: string;
  };
  createdAt: string;
};

export default function DoctorApprovalsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    try {
      const res = await fetch("/api/sfa/doctors/approve?status=pending");
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(doctorId: string, action: "approve" | "reject") {
    setProcessing(doctorId);
    try {
      const res = await fetch("/api/sfa/doctors/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, action }),
      });

      if (res.ok) {
        // Remove from list
        setDoctors(doctors.filter((d) => d._id !== doctorId));
        setSelectedDoctor(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to process request");
      }
    } catch (error) {
      alert("Failed to process request");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Approvals</h1>
        <p className="text-gray-600">Review and approve doctors added from Racer app</p>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Check className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending doctor approvals at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Cards */}
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition ${
                  selectedDoctor?._id === doctor._id ? "ring-2 ring-blue-500" : "hover:shadow-lg"
                }`}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">UIN: {doctor.uinId}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Pending
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{doctor.hospitalName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{doctor.contactNo}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Added by {doctor.createdBy.name} on {new Date(doctor.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(doctor._id, "approve");
                    }}
                    disabled={processing === doctor._id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(doctor._id, "reject");
                    }}
                    disabled={processing === doctor._id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Doctor Details Panel */}
          <div className="sticky top-8">
            {selectedDoctor ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Doctor Details</h2>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Name:</dt>
                        <dd className="font-medium">{selectedDoctor.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">UIN ID:</dt>
                        <dd className="font-medium text-blue-600">{selectedDoctor.uinId}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Gender:</dt>
                        <dd className="font-medium capitalize">{selectedDoctor.gender}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Qualification:</dt>
                        <dd className="font-medium">{selectedDoctor.qualification}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Speciality:</dt>
                        <dd className="font-medium">{selectedDoctor.speciality}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Category:</dt>
                        <dd className="font-medium">{selectedDoctor.category}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Phone:</dt>
                        <dd className="font-medium">{selectedDoctor.contactNo}</dd>
                      </div>
                      {selectedDoctor.email && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Email:</dt>
                          <dd className="font-medium">{selectedDoctor.email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Hospital Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Hospital Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Hospital:</dt>
                        <dd className="font-medium">{selectedDoctor.hospitalName}</dd>
                      </div>
                      {selectedDoctor.hospitalAddress && (
                        <div>
                          <dt className="text-gray-600 mb-1">Address:</dt>
                          <dd className="font-medium text-sm">{selectedDoctor.hospitalAddress}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Location */}
                  {selectedDoctor.location && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Location</h3>
                      <a
                        href={`https://www.google.com/maps?q=${selectedDoctor.location.latitude},${selectedDoctor.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        View on Google Maps
                      </a>
                    </div>
                  )}

                  {/* Bank Details */}
                  {selectedDoctor.bankDetails && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Bank:</dt>
                          <dd className="font-medium">{selectedDoctor.bankDetails.bankName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Account:</dt>
                          <dd className="font-medium">{selectedDoctor.bankDetails.accountNumber}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">IFSC:</dt>
                          <dd className="font-medium">{selectedDoctor.bankDetails.ifscCode}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Branch:</dt>
                          <dd className="font-medium">{selectedDoctor.bankDetails.branchName}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedDoctor.documents && selectedDoctor.documents.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Documents</h3>
                      <p className="text-sm text-gray-600">{selectedDoctor.documents.length} document(s) uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a doctor to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
