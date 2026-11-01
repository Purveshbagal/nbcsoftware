import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import {
  distinctValues,
  loadMasterOptions,
} from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import DoctorModel from "@/models/Doctor";
import DoctorQualificationModel from "@/models/DoctorQualification";
import DoctorSpecialityModel, { DEFAULT_SPECIALITIES } from "@/models/DoctorSpeciality";

const doctorCategories = ["Important", "Super Important", "A"];

const columns: Column[] = [
  { key: "name", label: "Doctor Name" },
  { key: "qualification", label: "Qualification" },
  { key: "contactNo", label: "Mobile Number" },
  { key: "hospitalName", label: "Hospital Name" },
];

export default async function DoctorsPage() {
  await connectToDatabase();

  const [docs, masters, qualifications, specialities] = await Promise.all([
    DoctorModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions([
      "state",
      "district",
      "taluka",
      "village",
    ]),
    DoctorQualificationModel.find({ isActive: true })
      .select("name")
      .sort({ name: 1 })
      .lean<{ name: string }[]>(),
    DoctorSpecialityModel.find({ isActive: true })
      .select("name")
      .sort({ name: 1 })
      .lean<{ name: string }[]>(),
  ]);

  const rows = toPlainRows(docs);
  const qualificationOptions = qualifications.map(({ name }) => name);
  const specialityOptions = [...new Set([
    ...DEFAULT_SPECIALITIES,
    ...specialities.map(({ name }) => name),
  ])].sort((a, b) => a.localeCompare(b));

  const fields: Field[] = [
    // Basic Information (matching mobile-labs exactly)
    { key: "name", label: "Doctor Name", required: true, section: "BASIC INFORMATION" },
    { key: "contactNo", label: "Mobile Number", type: "tel", required: true, section: "BASIC INFORMATION" },
    { key: "registrationNumber", label: "Registration Number", section: "BASIC INFORMATION" },
    { key: "email", label: "Email", type: "email", section: "BASIC INFORMATION" },
    {
      key: "qualification",
      label: "Qualification",
      type: "select",
      options: qualificationOptions,
      section: "BASIC INFORMATION",
    },
    {
      key: "speciality",
      label: "Speciality",
      type: "select",
      options: specialityOptions,
      section: "BASIC INFORMATION",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: doctorCategories,
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
    {
      key: "state",
      label: "State",
      type: "select",
      options: [...new Set(["Maharashtra", ...(masters.state || [])])],
      defaultValue: "Maharashtra",
      section: "Hospital Information",
    },
    {
      key: "district",
      label: "District",
      type: "select",
      options: masters.district || [],
      section: "Hospital Information",
    },
    {
      key: "taluka",
      label: "Taluka",
      type: "select",
      options: masters.taluka || [],
      section: "Hospital Information",
    },
    {
      key: "village",
      label: "Village",
      type: "select",
      options: masters.village || [],
      section: "Hospital Information",
    },
    { key: "city", label: "City", section: "Hospital Information" },
    { key: "pincode", label: "Pincode", section: "Hospital Information" },
    { key: "clinicAddress", label: "Clinic Address", type: "textarea", wide: true, section: "Hospital Information" },

    // Bank Details
    { key: "bankName", label: "Bank Name (Optional)", section: "Bank Details" },
    { key: "accountNumber", label: "Account Number (Optional)", section: "Bank Details" },
    { key: "ifscCode", label: "IFSC Code (Optional)", section: "Bank Details" },
    { key: "branchName", label: "Branch Name (Optional)", section: "Bank Details" },
  ];
  const createFields = fields.filter(
    ({ key }) => !["city", "pincode", "clinicAddress"].includes(key),
  );

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
        createFields={createFields}
        detailHref="/sfa/people/doctors"
        filters={[
          { key: "speciality", label: "Speciality", options: specialityOptions },
          { key: "category", label: "Category", options: doctorCategories },
          { key: "city", label: "City", options: distinctValues(rows, "city") },
        ]}
      />
    </div>
  );
}
