import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import {
  distinctValues,
  loadEmployeeNames,
  loadFirmNames,
  loadMasterOptions,
} from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import DoctorModel from "@/models/Doctor";

const columns: Column[] = [
  { key: "doctorCode", label: "Doctor Code" },
  { key: "name", label: "Doctor Name" },
  { key: "hospitalName", label: "Hospital" },
  { key: "city", label: "City" },
  { key: "contactNo", label: "Contact No" },
  { key: "speciality", label: "Speciality" },
  { key: "category", label: "Category" },
  { key: "division", label: "Division", secondary: true },
  { key: "zone", label: "Zone", secondary: true },
  { key: "qualification", label: "Qualification", secondary: true },
  { key: "registrationNumber", label: "Registration No", secondary: true },
  { key: "assignedEmployees", label: "Employee", type: "list", secondary: true },
  { key: "email", label: "Email", secondary: true },
  { key: "district", label: "District", secondary: true },
  { key: "doctorType", label: "Type", secondary: true },
  { key: "approxBusiness", label: "Approx Business", secondary: true },
  { key: "createdAt", label: "Added On", type: "date", secondary: true },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function DoctorsPage() {
  await connectToDatabase();

  const [docs, masters, employees, firms] = await Promise.all([
    DoctorModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions([
      "division",
      "zone",
      "doctor-speciality",
      "doctor-category",
      "qualification",
      "type",
      "business-slab",
    ]),
    loadEmployeeNames(),
    loadFirmNames(),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "doctorCode", label: "Doctor Code", section: "Basic information", placeholder: "Auto or manual code" },
    {
      key: "prefix",
      label: "Prefix",
      type: "select",
      options: ["Dr", "Mr", "Ms", "Miss"],
      section: "Basic information",
    },
    { key: "name", label: "Doctor Name", required: true, section: "Basic information" },
    { key: "hospitalName", label: "Hospital Name", section: "Basic information" },
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: ["male", "female", "other"],
      section: "Basic information",
    },
    { key: "contactNo", label: "Contact No", type: "tel", section: "Basic information" },
    { key: "email", label: "Email", type: "email", section: "Basic information" },
    { key: "dateOfBirth", label: "Date of Birth", type: "date", section: "Basic information" },
    {
      key: "maritalStatus",
      label: "Marital Status",
      type: "select",
      options: ["Married", "Single", "Other"],
      section: "Basic information",
    },
    { key: "anniversary", label: "Anniversary", type: "date", section: "Basic information" },
    {
      key: "qualification",
      label: "Qualification",
      type: "select",
      options: masters.qualification,
      section: "Basic information",
    },
    { key: "registrationNumber", label: "Registration Number", section: "Basic information" },

    { key: "state", label: "State", section: "Address information" },
    { key: "district", label: "District", section: "Address information" },
    { key: "city", label: "City", section: "Address information" },
    { key: "pincode", label: "Pincode", section: "Address information" },
    { key: "clinicAddress", label: "Clinic Address", type: "textarea", wide: true, section: "Address information" },

    {
      key: "division",
      label: "Division",
      type: "select",
      options: masters.division,
      section: "Work information",
    },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Work information" },
    {
      key: "speciality",
      label: "Speciality",
      type: "select",
      options: masters["doctor-speciality"],
      section: "Work information",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: masters["doctor-category"],
      section: "Work information",
    },
    {
      key: "doctorType",
      label: "Type",
      type: "select",
      options: masters.type,
      section: "Work information",
    },
    {
      key: "approxBusiness",
      label: "Approx Business",
      type: "select",
      options: masters["business-slab"],
      section: "Work information",
    },

    {
      key: "assignedEmployees",
      label: "Assigned Employees",
      type: "multiselect",
      options: employees,
      wide: true,
      section: "Assignment",
    },
    {
      key: "firms",
      label: "Linked Firms",
      type: "multiselect",
      options: firms,
      wide: true,
      section: "Assignment",
    },
    { key: "isActive", label: "Active", type: "checkbox", section: "Assignment" },
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
          { key: "division", label: "Division", options: masters.division },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "speciality", label: "Speciality", options: masters["doctor-speciality"] },
          { key: "category", label: "Category", options: masters["doctor-category"] },
          { key: "city", label: "City", options: distinctValues(rows, "city") },
        ]}
      />
    </div>
  );
}
