export type SettingField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "checkbox" | "number";
  options?: string[];
  help?: string;
};

export type SettingGroup = {
  slug: string;
  title: string;
  description: string;
  fields: SettingField[];
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    slug: "branding",
    title: "Branding",
    description: "How the workspace presents itself to the field team.",
    fields: [
      { key: "companyName", label: "Company name" },
      { key: "shortName", label: "Short name", help: "Used where space is tight." },
      { key: "logoUrl", label: "Logo URL" },
      { key: "supportEmail", label: "Support email" },
      { key: "supportPhone", label: "Support phone" },
      { key: "address", label: "Registered address", type: "textarea" },
    ],
  },
  {
    slug: "general",
    title: "General Settings",
    description: "Defaults that govern how calls, claims and sync behave.",
    fields: [
      {
        key: "weekStart",
        label: "Week starts on",
        type: "select",
        options: ["Sunday", "Monday"],
      },
      { key: "minCallsPerDay", label: "Minimum calls per day", type: "number" },
      { key: "maxCallsPerDay", label: "Maximum calls per day", type: "number" },
      {
        key: "allowBackdatedCalls",
        label: "Allow back-dated calls",
        type: "checkbox",
      },
      { key: "backdatedDays", label: "Back-dated days allowed", type: "number" },
      {
        key: "geoFenceMetres",
        label: "Geo-fence radius (metres)",
        type: "number",
        help: "How close to the recorded location a call must be logged.",
      },
      {
        key: "requirePhotoOnCall",
        label: "Require a photo on every call",
        type: "checkbox",
      },
      { key: "currency", label: "Currency symbol" },
    ],
  },
  {
    slug: "terminology",
    title: "Terminology Settings",
    description:
      "Rename the things this workspace talks about. These labels are what the field team sees.",
    fields: [
      { key: "doctorLabel", label: "Word for 'Doctor'" },
      { key: "firmLabel", label: "Word for 'Firm'" },
      { key: "employeeLabel", label: "Word for 'Employee'" },
      { key: "visitLabel", label: "Word for 'Visit'" },
      { key: "zoneLabel", label: "Word for 'Zone'" },
      { key: "divisionLabel", label: "Word for 'Division'" },
      { key: "pobLabel", label: "Word for 'POB'" },
    ],
  },
  {
    slug: "approvals",
    title: "Approval & Email Setting",
    description: "Who signs off on what, and who hears about it.",
    fields: [
      {
        key: "expenseApprover",
        label: "Expense approved by",
        type: "select",
        options: ["First level manager", "Second level manager", "Admin"],
      },
      {
        key: "leaveApprover",
        label: "Leave approved by",
        type: "select",
        options: ["First level manager", "Second level manager", "Admin"],
      },
      {
        key: "doctorApprovalRequired",
        label: "New doctors need approval",
        type: "checkbox",
      },
      {
        key: "firmApprovalRequired",
        label: "New firms need approval",
        type: "checkbox",
      },
      { key: "notifyEmails", label: "Notify these email addresses", type: "textarea", help: "One address per line." },
    ],
  },
];

export function findSettingGroup(slug: string) {
  return SETTING_GROUPS.find((group) => group.slug === slug);
}
