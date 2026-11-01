import {
  BadgeIndianRupee,
  BarChart3,
  Briefcase,
  CircleCheckBig,
  ClipboardList,
  Contact,
  FileStack,
  GraduationCap,
  History,
  Hourglass,
  LayoutDashboard,
  ListChecks,
  MapPin,
  MessageCircle,
  MonitorPlay,
  Navigation,
  Package,
  QrCode,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  UserSearch,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLeaf = {
  title: string;
  url: string;
};

export type NavNode = {
  title: string;
  icon: LucideIcon;
  /** Set for a node that is itself a page. Omit when the node only groups `items`. */
  url?: string;
  items?: NavLeaf[];
};

export type NavGroup = {
  label: string;
  items: NavNode[];
};

export type Workspace = {
  id: string;
  name: string;
  tagline: string;
  /** Short label shown in the header pill on the right. */
  badge: string;
  icon: LucideIcon;
  /** Landing route — also the prefix that decides which workspace a path belongs to. */
  home: string;
  /** Paths owned by this workspace. The longest match wins, so order is irrelevant. */
  prefixes: string[];
  groups: NavGroup[];
};

/**
 * Every master list in Settings → Application Master is the same screen with a
 * different `type`, so they share one route and one collection. Adding a master
 * means adding a row here — no new page, model or API route.
 */
export const MASTER_TYPES = [
  { slug: "activity-type", title: "Activity Type", description: "Types of field activity an employee can log." },
  { slug: "announcement", title: "Announcement", description: "Notices pushed to the field team." },
  { slug: "application-tab", title: "Application Tab", description: "Tabs enabled in the mobile app." },
  { slug: "assign-item", title: "Assign Item", description: "Items issued to and relieved from employees." },
  { slug: "business-slab", title: "Business Slab", description: "Approximate business ranges for doctors and firms." },
  { slug: "call-objective", title: "Call Objective", description: "Objectives selectable on a visit." },
  { slug: "campaign", title: "Campaign", description: "Promotional campaigns." },
  { slug: "designation", title: "Designation", description: "Employee designations and their hierarchy level." },
  { slug: "district", title: "District", description: "Administrative districts within Maharashtra state." },
  { slug: "division", title: "Division", description: "Product divisions the team is split across." },
  { slug: "doctor-category", title: "Doctor Category", description: "Grading used to prioritise doctors." },
  { slug: "doctor-speciality", title: "Doctor Speciality", description: "Medical specialities." },
  { slug: "doctor-additional-info", title: "Doctor Additional Info", description: "Extra fields captured on a doctor." },
  { slug: "expense-head", title: "Expense Head", description: "Heads an expense can be claimed under." },
  { slug: "faq-master", title: "FAQ Master", description: "Questions available to the field team." },
  { slug: "firm-additional-info", title: "Firm Additional Info", description: "Extra fields captured on a firm." },
  { slug: "firm-category", title: "Firm Category", description: "Categories used to group firms." },
  { slug: "firm-type", title: "Firm Type", description: "Company, distributor, stockist, retailer." },
  { slug: "fixed-allowance", title: "Fixed Allowance", description: "Allowances paid regardless of travel." },
  { slug: "free-be-products", title: "Free Be Products", description: "Products given away free of cost." },
  { slug: "hospital-category", title: "Hospital Category", description: "Categories used to group hospitals." },
  { slug: "hospital-class", title: "Hospital Class", description: "Classes used to grade hospitals." },
  { slug: "hospital-speciality", title: "Hospital Speciality", description: "Specialities offered by a hospital." },
  { slug: "incharge-type", title: "Incharge Type", description: "Roles a person can be in charge of." },
  { slug: "leave-reason", title: "Leave Reasons", description: "Reasons selectable when applying for leave." },
  { slug: "mode-of-travel", title: "Mode Of Travel", description: "Travel modes used in the fare chart." },
  { slug: "other-reason", title: "Others Reason", description: "Catch-all reasons." },
  { slug: "post-call-info", title: "Post Call Information", description: "Information captured after a call." },
  { slug: "product-indication", title: "Product Indication", description: "Indications a product is prescribed for." },
  { slug: "product-sample", title: "Product Samples", description: "Samples that can be handed out." },
  { slug: "promotional-gift", title: "Promotional Gifts", description: "Gifts that can be handed out." },
  { slug: "qualification", title: "Qualification", description: "Doctor qualifications." },
  { slug: "radius-setting", title: "Radius Settings", description: "Geo-fence radius applied to visits." },
  { slug: "relation-master", title: "Relation Master", description: "Relationships recorded against a contact." },
  { slug: "sample-collection", title: "Sample Collection", description: "Sample collection centres." },
  { slug: "scheme-master", title: "Scheme Master", description: "Trade schemes applied to orders." },
  { slug: "skipped-reason", title: "Skipped Reasons", description: "Reasons a planned call was skipped." },
  { slug: "state", title: "State", description: "Indian states." },
  { slug: "taluka", title: "Taluka", description: "Talukas (sub-districts) within districts." },
  { slug: "tax-master", title: "Tax Master", description: "Tax rates applied to order lines." },
  { slug: "test-typology", title: "Test Typology", description: "Diagnostic test types." },
  { slug: "travel-mode", title: "Travel Mode", description: "Modes of travel like Bike, Car, Public Transport." },
  { slug: "type", title: "Type", description: "Prescriber / non-prescriber and other priority types." },
  { slug: "uom", title: "UOM", description: "Units of measure." },
  { slug: "village", title: "Village", description: "Villages within talukas." },
  { slug: "visit-counter", title: "Visit Counter", description: "Minimum visits expected per period." },
  { slug: "work-agenda", title: "Work Agenda", description: "Agenda options for a working day." },
  { slug: "zone", title: "Zone", description: "Geographic zones / headquarters." },
] as const;

export type MasterType = (typeof MASTER_TYPES)[number];

export function findMasterType(slug: string): MasterType | undefined {
  return MASTER_TYPES.find((master) => master.slug === slug);
}

const teamGroups: NavGroup[] = [
  {
    label: "Registration",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Register List", url: "/register/list", icon: ListChecks },
      { title: "Approval History", url: "/register/approval-history", icon: History },
    ],
  },
  {
    label: "Payments",
    items: [
      { title: "Payment Request", url: "/payment/request", icon: Wallet },
      { title: "Payment History", url: "/payment/approval-history", icon: History },
      { title: "Give Payment", url: "/payment/give", icon: BadgeIndianRupee },
      { title: "Pending Payments", url: "/payment/pending", icon: Hourglass },
      { title: "Paid Payments", url: "/payment/paid", icon: CircleCheckBig },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Survey Reports", url: "/survey-reports", icon: BarChart3 },
      { title: "Budget Analytics", url: "/budget-analytics", icon: BadgeIndianRupee },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users", url: "/users", icon: Users },
    ],
  },
];

const fieldForceGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/sfa", icon: LayoutDashboard },
      { title: "Updates", url: "/sfa/overview/updates", icon: FileStack },
      {
        title: "Visits",
        icon: MapPin,
        items: [
          { title: "Doctors Visit", url: "/sfa/visits/doctors" },
          { title: "Firms Visit", url: "/sfa/visits/firms" },
        ],
      },
      { title: "Doctors", url: "/sfa/people/doctors", icon: UserSearch },
      { title: "Employees", url: "/sfa/people/employees", icon: Users },
      { title: "Doctor Approvals", url: "/sfa/doctor-approvals", icon: CircleCheckBig },
      { title: "Live Tracking", url: "/sfa/tracking", icon: Navigation },
      { title: "Chat", url: "/sfa/chat", icon: MessageCircle },
      { title: "Reports", url: "/sfa/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Commercial",
    items: [
      {
        title: "Expense",
        icon: Receipt,
        items: [
          { title: "Expense", url: "/sfa/expense/all" },
          { title: "Req Expense", url: "/sfa/expense/requests" },
          { title: "Pending Expense", url: "/sfa/expense/pending" },
          { title: "Expense Payment", url: "/sfa/expense/payment" },
          { title: "Expense Setting", url: "/sfa/expense/settings" },
        ],
      },
      { title: "Products", url: "/sfa/products", icon: Package },
      { title: "Sample Request", url: "/sfa/sample-request", icon: ClipboardList },
    ],
  },
  {
    label: "Workplace",
    items: [
      {
        title: "Employee Payroll",
        icon: UserSearch,
        items: [
          { title: "Employee Salary", url: "/sfa/hr/employee-salary" },
          { title: "Attendance", url: "/sfa/hr/attendance" },
          { title: "Pending Salary", url: "/sfa/hr/pending-salary" },
          { title: "Salary Payment", url: "/sfa/hr/salary-payment" },
          { title: "Advanced Payment", url: "/sfa/hr/advanced-payment" },
          { title: "Advance Request", url: "/sfa/hr/advance-request" },
          { title: "Leave Requests", url: "/sfa/hr/leave-requests" },
          { title: "Holiday Settings", url: "/sfa/hr/holiday-settings" },
        ],
      },
      { title: "Presentation", url: "/presentations", icon: MonitorPlay },
      {
        title: "E-detailing",
        icon: MonitorPlay,
        items: [
          { title: "Media Gallery", url: "/sfa/e-detailing/media" },
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Set Village",
        icon: MapPin,
        url: "/sfa/locations/districts",
      },
    ],
  },
];

export const WORKSPACES: Workspace[] = [
  {
    id: "team",
    name: "Survey NBC",
    tagline: "Team workspace",
    badge: "Administration workspace",
    icon: GraduationCap,
    home: "/dashboard",
    prefixes: ["/dashboard", "/register", "/payment", "/survey-reports", "/users", "/budget-analytics"],
    groups: teamGroups,
  },
  {
    id: "field-force",
    name: "Racer NBC",
    tagline: "Field force workspace",
    badge: "Field force workspace",
    icon: MapPin,
    home: "/sfa",
    prefixes: ["/sfa", "/presentations"],
    groups: fieldForceGroups,
  },
];

export const DEFAULT_WORKSPACE = WORKSPACES[0];

/** The workspace that owns `pathname`, by longest matching prefix. */
export function workspaceForPath(pathname: string): Workspace {
  let best = DEFAULT_WORKSPACE;
  let bestLength = -1;

  for (const workspace of WORKSPACES) {
    for (const prefix of workspace.prefixes) {
      const matches = pathname === prefix || pathname.startsWith(`${prefix}/`);
      if (matches && prefix.length > bestLength) {
        best = workspace;
        bestLength = prefix.length;
      }
    }
  }

  return best;
}

/** Flattened leaves of a workspace, used to title the header. */
export function navLeaves(workspace: Workspace): NavLeaf[] {
  return workspace.groups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.items ? item.items : item.url ? [{ title: item.title, url: item.url }] : []
    )
  );
}

/** The deepest nav entry matching `pathname`, across every workspace. */
export function navTitleForPath(pathname: string): string | undefined {
  const workspace = workspaceForPath(pathname);
  const leaves = navLeaves(workspace);

  let best: NavLeaf | undefined;
  for (const leaf of leaves) {
    const matches = pathname === leaf.url || pathname.startsWith(`${leaf.url}/`);
    if (matches && (!best || leaf.url.length > best.url.length)) {
      best = leaf;
    }
  }

  return best?.title;
}
