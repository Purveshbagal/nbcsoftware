import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft, MapPin } from "lucide-react";

import { PageHeader } from "@/components/sfa/page-header";
import { connectToDatabase } from "@/lib/mongodb";
import DoctorModel from "@/models/Doctor";

export const dynamic = "force-dynamic";

function InfoField({ label, value }: { label: string; value: unknown }) {
  const text = Array.isArray(value)
    ? value.length
      ? value.join(", ")
      : "—"
    : value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{text}</dd>
    </div>
  );
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const doctor = await DoctorModel.findById(id).lean();
  if (!doctor) notFound();

  const location = doctor.location;
  const hasCoordinates =
    typeof location?.latitude === "number" &&
    typeof location.longitude === "number";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link
        href="/sfa/people/doctors"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to doctors
      </Link>

      <PageHeader
        title={`${doctor.prefix ? `${doctor.prefix} ` : ""}${doctor.name}`}
        description={[doctor.doctorCode, doctor.uinId, doctor.qualification]
          .filter(Boolean)
          .join(" · ")}
      />

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Basic information</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Doctor name" value={doctor.name} />
          <InfoField label="Prefix" value={doctor.prefix} />
          <InfoField label="Doctor code" value={doctor.doctorCode} />
          <InfoField label="UIN ID" value={doctor.uinId} />
          <InfoField label="Mobile number" value={doctor.contactNo} />
          <InfoField label="Email" value={doctor.email} />
          <InfoField label="Qualification" value={doctor.qualification} />
          <InfoField label="Registration number" value={doctor.registrationNumber} />
          <InfoField label="Speciality" value={doctor.speciality} />
          <InfoField label="Category" value={doctor.category} />
          <InfoField label="Doctor type" value={doctor.doctorType} />
          <InfoField label="Gender" value={doctor.gender} />
          <InfoField label="Date of birth" value={doctor.dateOfBirth} />
          <InfoField label="Anniversary" value={doctor.anniversary} />
          <InfoField label="Marital status" value={doctor.maritalStatus} />
          <InfoField label="Approximate business" value={doctor.approxBusiness} />
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Hospital and address</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Hospital name" value={doctor.hospitalName} />
          <InfoField label="Hospital address" value={doctor.hospitalAddress} />
          <InfoField label="Clinic address" value={doctor.clinicAddress} />
          <InfoField label="City" value={doctor.city} />
          <InfoField label="Village" value={doctor.village} />
          <InfoField label="Taluka" value={doctor.taluka} />
          <InfoField label="District" value={doctor.district} />
          <InfoField label="State" value={doctor.state} />
          <InfoField label="Pincode" value={doctor.pincode} />
          <InfoField label="Division" value={doctor.division} />
          <InfoField label="Zone" value={doctor.zone} />
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Bank details</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Bank name" value={doctor.bankName} />
          <InfoField label="Account number" value={doctor.accountNumber} />
          <InfoField label="IFSC code" value={doctor.ifscCode} />
          <InfoField label="Branch name" value={doctor.branchName} />
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Assignments and status</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Assigned employees" value={doctor.assignedEmployees} />
          <InfoField label="Firms" value={doctor.firms} />
          <InfoField label="Active status" value={doctor.isActive === false ? "Inactive" : "Active"} />
          <InfoField label="Approval status" value={doctor.approvalStatus} />
          <InfoField label="Approved by" value={doctor.approvedBy?.name} />
          <InfoField
            label="Approved at"
            value={doctor.approvedAt ? new Date(doctor.approvedAt).toLocaleString("en-IN") : ""}
          />
          <InfoField label="Source" value={doctor.source} />
          <InfoField label="Added by" value={doctor.createdBy?.name} />
          <InfoField label="Added by username" value={doctor.createdBy?.username} />
          <InfoField
            label="Added on"
            value={doctor.createdAt ? new Date(doctor.createdAt).toLocaleString("en-IN") : ""}
          />
          <InfoField
            label="Last updated"
            value={doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleString("en-IN") : ""}
          />
          <InfoField label="Documents" value={`${doctor.documents?.length ?? 0} uploaded`} />
          <InfoField label="Latitude" value={location?.latitude} />
          <InfoField label="Longitude" value={location?.longitude} />
        </dl>
        {hasCoordinates && (
          <a
            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-5 inline-flex items-center gap-2 text-sm hover:underline"
          >
            <MapPin className="size-4" />
            View location on Google Maps
          </a>
        )}
      </section>
    </div>
  );
}
