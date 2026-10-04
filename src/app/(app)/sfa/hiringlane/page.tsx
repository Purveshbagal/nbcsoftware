import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function HiringlanePage() {
  return (
    <ModulePlaceholder
      title="Hiringlane"
      summary="Vacancies, applicants and the hiring pipeline for field roles."
      willInclude={[
        "Open positions by zone, division and designation",
        "Applicants and their stage in the pipeline",
        "Interview scheduling and feedback",
        "Converting a hire into an employee record",
      ]}
      related={[
        { href: "/sfa/people/employees", label: "Employees" },
        { href: "/sfa/settings/masters/designation", label: "Designation" },
      ]}
    />
  );
}
