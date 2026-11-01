import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import {
  distinctValues,
  loadMasterOptions,
} from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import DoctorModel from "@/models/Doctor";

const columns: Column[] = [
  { key: "name", label: "Doctor Name" },
  { key: "hospitalName", label: "Hospital" },
  { key: "contactNo", label: "Contact No" },
  { key: "speciality", label: "Speciality" },
  { key: "category", label: "Category" },
  { key: "qualification", label: "Qualification", secondary: true },
  { key: "registrationNumber", label: "Registration No", secondary: true },
  { key: "email", label: "Email", secondary: true },
  { key: "gender", label: "Gender", secondary: true },
  { key: "state", label: "State", secondary: true },
  { key: "district", label: "District", secondary: true },
  { key: "taluka", label: "Taluka", secondary: true },
  { key: "village", label: "Village", secondary: true },
  { key: "city", label: "City", secondary: true },
  { key: "pincode", label: "Pincode", secondary: true },
  { key: "bankName", label: "Bank Name", secondary: true },
  { key: "accountNumber", label: "Account Number", secondary: true },
  { key: "ifscCode", label: "IFSC Code", secondary: true },
  { key: "branchName", label: "Branch Name", secondary: true },
  { key: "createdAt", label: "Added On", type: "date", secondary: true },
];

export default async function DoctorsPage() {
  await connectToDatabase();

  const [docs, masters] = await Promise.all([
    DoctorModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions([
      "doctor-speciality",
      "doctor-category",
      "qualification",
      "state",
      "district",
      "taluka",
      "village",
    ]),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    // Basic Information (matching mobile-labs exactly)
    { key: "name", label: "Doctor Name", required: true, section: "BASIC INFORMATION" },
    { key: "contactNo", label: "Mobile Number", type: "tel", required: true, section: "BASIC INFORMATION" },
    { key: "registrationNumber", label: "Registration Number", section: "BASIC INFORMATION" },
    {
      key: "qualification",
      label: "Qualification",
      type: "select",
      options: masters.qualification,
      section: "BASIC INFORMATION",
    },
    {
      key: "speciality",
      label: "Speciality",
      type: "select",
      options: masters["doctor-speciality"],
      section: "BASIC INFORMATION",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: masters["doctor-category"],
      section: "BASIC INFORMATION",
    },
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: ["Male", "Female", "Other"],
      section: "BASIC INFORMATION",
    },

    // Hospital Information
    { key: "hospitalName", label: "Hospital Name", required: true, section: "Hospital Information" },
    { key: "hospitalAddress", label: "Hospital Address", type: "textarea", wide: true, section: "Hospital Information" },
    { key: "email", label: "Email", type: "email", section: "Hospital Information" },

    // Address Information
    {
      key: "state",
      label: "State",
      type: "select",
      options: masters.state || [],
      section: "Address Information",
    },
    {
      key: "district",
      label: "District",
      type: "select",
      options: masters.district || [],
      section: "Address Information",
    },
    {
      key: "taluka",
      label: "Taluka",
      type: "select",
      options: masters.taluka || [],
      section: "Address Information",
    },
    {
      key: "village",
      label: "Village",
      type: "select",
      options: masters.village || [],
      section: "Address Information",
    },
    { key: "city", label: "City", section: "Address Information" },
    { key: "pincode", label: "Pincode", section: "Address Information" },
    { key: "clinicAddress", label: "Clinic Address", type: "textarea", wide: true, section: "Address Information" },

    // Bank Details
    { key: "bankName", label: "Bank Name (Optional)", section: "Bank Details" },
    { key: "accountNumber", label: "Account Number (Optional)", section: "Bank Details" },
    { key: "ifscCode", label: "IFSC Code (Optional)", section: "Bank Details" },
    { key: "branchName", label: "Branch Name (Optional)", section: "Bank Details" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Doctors"
        description="The doctor universe your field team calls on. Dropdown values come from Settings → Application Master."
      />
      <EntityTable
        endpoint="/api/sfa/doctors"
        entityName="Doctor"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "speciality", label: "Speciality", options: masters["doctor-speciality"] },
          { key: "category", label: "Category", options: masters["doctor-category"] },
          { key: "city", label: "City", options: distinctValues(rows, "city") },
        ]}
      />
    </div>
  );
}
