import { ModulePlaceholder } from "@/components/sfa/module-placeholder";

export default function FilesPage() {
  return (
    <ModulePlaceholder
      title="Files"
      summary="A shared folder tree for circulars, price lists and anything else the field team needs to download."
      willInclude={[
        "Folders and file uploads, with a storage backend to hold the binaries",
        "Per-division and per-zone visibility",
        "Download tracking, so you can see who has read a circular",
      ]}
      related={[
        { href: "/sfa/e-detailing/media", label: "Media Gallery" },
        { href: "/sfa/e-detailing/presentation", label: "Presentations" },
      ]}
    />
  );
}
