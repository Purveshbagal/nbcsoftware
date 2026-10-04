import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function CourseWorkPage() {
  return (
    <ModulePlaceholder
      title="Course Work"
      summary="Training courses and quizzes for the field team."
      willInclude={[
        "Courses built from the media and presentations already uploaded",
        "Quizzes with a pass mark, drawing on the FAQ master",
        "Per-employee completion and scores",
      ]}
      related={[
        { href: "/sfa/e-detailing/presentation", label: "Presentations" },
        { href: "/sfa/settings/masters/faq-master", label: "FAQ Master" },
      ]}
    />
  );
}
