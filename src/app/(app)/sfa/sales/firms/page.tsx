import { EntityTable } from "@/components/sfa/entity-table";
import { PageHeader } from "@/components/sfa/page-header";
import { distinctValues, loadEmployeeNames, loadMasterOptions } from "@/lib/master-options";
import { connectToDatabase } from "@/lib/mongodb";
import { toPlainRows, type Column, type Field } from "@/lib/sfa-ui";
import FirmModel from "@/models/Firm";

const columns: Column[] = [
  { key: "firmCode", label: "Firm Code" },
  { key: "name", label: "Firm Name" },
  { key: "firmType", label: "Firm Type" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "contactNo", label: "Contact Number" },
  { key: "city", label: "City" },
  { key: "zone", label: "Zone" },
  { key: "division", label: "Division", secondary: true },
  { key: "firmCategory", label: "Category", secondary: true },
  { key: "assignedEmployees", label: "Employee Assigned", type: "list", secondary: true },
  { key: "email", label: "Email", secondary: true },
  { key: "gstin", label: "GSTIN", secondary: true },
  { key: "panNumber", label: "PAN Number", secondary: true },
  { key: "drugLicenseNumber", label: "Drug License", secondary: true },
  { key: "approxBusiness", label: "Approx Business", secondary: true },
  { key: "isActive", label: "Status", type: "bool" },
];

export default async function FirmsPage() {
  await connectToDatabase();

  const [docs, masters, employees] = await Promise.all([
    FirmModel.find({}).sort({ createdAt: -1 }).lean(),
    loadMasterOptions(["division", "zone", "firm-type", "firm-category", "business-slab"]),
    loadEmployeeNames(),
  ]);

  const rows = toPlainRows(docs);

  const fields: Field[] = [
    { key: "firmCode", label: "Firm Code", section: "Basic information" },
    { key: "name", label: "Firm Name", required: true, section: "Basic information" },
    {
      key: "firmType",
      label: "Firm Type",
      type: "select",
      options: masters["firm-type"].length
        ? masters["firm-type"]
        : ["Company", "Distributor", "Stockist", "Retailer"],
      section: "Basic information",
    },
    {
      key: "firmCategory",
      label: "Firm Category",
      type: "select",
      options: masters["firm-category"],
      section: "Basic information",
    },
    { key: "contactPerson", label: "Contact Person", section: "Basic information" },
    { key: "contactNo", label: "Contact Number", type: "tel", section: "Basic information" },
    { key: "email", label: "Email", type: "email", section: "Basic information" },
    { key: "dateOfBirth", label: "Date Of Birth", type: "date", section: "Basic information" },
    {
      key: "approxBusiness",
      label: "Approx Business",
      type: "select",
      options: masters["business-slab"],
      section: "Basic information",
    },
    { key: "transportType", label: "Transport Type", section: "Basic information" },

    { key: "state", label: "State", section: "Address information" },
    { key: "district", label: "District", section: "Address information" },
    { key: "city", label: "City", section: "Address information" },
    { key: "pincode", label: "Pincode", section: "Address information" },
    { key: "address", label: "Firm Address", type: "textarea", wide: true, section: "Address information" },
    { key: "zone", label: "Zone", type: "select", options: masters.zone, section: "Address information" },
    {
      key: "division",
      label: "Division",
      type: "select",
      options: masters.division,
      section: "Address information",
    },
    {
      key: "additionalDivisions",
      label: "Additional Divisions",
      type: "multiselect",
      options: masters.division,
      wide: true,
      section: "Address information",
    },

    {
      key: "assignedEmployees",
      label: "Employees Assigned",
      type: "multiselect",
      options: employees,
      wide: true,
      section: "Assignment",
    },
    {
      key: "firstLevelManager",
      label: "First Level Manager",
      type: "select",
      options: employees,
      section: "Assignment",
    },
    {
      key: "secondLevelManager",
      label: "Second Level Manager",
      type: "select",
      options: employees,
      section: "Assignment",
    },
    {
      key: "thirdLevelManager",
      label: "Third Level Manager",
      type: "select",
      options: employees,
      section: "Assignment",
    },
    { key: "distributorCode", label: "Distributor Code", section: "Assignment" },
    { key: "stockistCode", label: "Stockist Code", section: "Assignment" },
    { key: "customerCode", label: "Customer Code", section: "Assignment" },

    { key: "gstin", label: "GSTIN", section: "KYC information" },
    { key: "panNumber", label: "PAN Number", section: "KYC information" },
    { key: "drugLicenseNumber", label: "Drug License Number", section: "KYC information" },
    { key: "foodLicenseNumber", label: "Food License Number", section: "KYC information" },
    { key: "bankName", label: "Bank Name", section: "KYC information" },
    { key: "branchName", label: "Branch Name", section: "KYC information" },
    { key: "accountNumber", label: "Account Number", section: "KYC information" },
    { key: "ifsc", label: "IFSC", section: "KYC information" },
    { key: "isActive", label: "Active", type: "checkbox", section: "KYC information" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Firms"
        description="Distributors, stockists and retailers, with their KYC and the employees who cover them."
      />
      <EntityTable
        endpoint="/api/sfa/firms"
        entityName="Firm"
        rows={rows}
        columns={columns}
        fields={fields}
        filters={[
          { key: "firmType", label: "Firm Type", options: masters["firm-type"] },
          { key: "division", label: "Division", options: masters.division },
          { key: "zone", label: "Zone", options: masters.zone },
          { key: "city", label: "City", options: distinctValues(rows, "city") },
        ]}
      />
    </div>
  );
}
