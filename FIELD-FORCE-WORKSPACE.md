# Field force workspace

The app now has two workspaces. The sidebar header is a switcher: click the
company name to move between them.

| Workspace | Routes | What it is |
| --- | --- | --- |
| NBC Pedia — Team workspace | `/dashboard`, `/register/*`, `/payment/*`, `/users` | The original registration and payment admin. Unchanged. |
| NBC Labs — Field force workspace | `/sfa/*` | A pharma field-force (SFA) system, modelled on the SEFMED/Cuztomise app at cuztomiseapp.com/safmed. |

Workspaces, their navigation and the master list are all declared in
[src/lib/workspaces.ts](src/lib/workspaces.ts). Adding a screen means adding a
nav entry there and a page under `src/app/(app)/sfa/`.

## How the field force workspace is built

Three pieces do most of the work, so a new module is usually a page file and
nothing else:

- **[src/components/sfa/entity-table.tsx](src/components/sfa/entity-table.tsx)** —
  a list screen described declaratively: columns, form fields, filters. It
  handles search, filtering, pagination, CSV export, and add / edit / delete
  dialogs. Server pages pass plain data, so the descriptions must stay
  serialisable (no functions).
- **[src/lib/sfa-crud.ts](src/lib/sfa-crud.ts)** — a factory that builds the
  `GET`/`POST` and `PATCH`/`DELETE` handlers for a collection from a field spec.
  The specs live in [src/lib/sfa-entities.ts](src/lib/sfa-entities.ts). Each API
  route file is four lines.
- **Master items** — every list under Settings → Application Master (43 of them)
  is one collection keyed by `type`, one dynamic route, and one page. Adding a
  master is a row in `MASTER_TYPES`.

Dropdowns across the workspace are fed from the masters, so what the team can
pick is always what Settings holds.

## What works today

Every screen below stores and reads real data.

- **People** — Doctors, Employees (with reporting hierarchy), Administrators
- **Visits** — Doctors Visit, Firms Visit (call objective, samples, gifts, POB)
- **Calendar** — Holiday / work / restricted calendar, leave calendar grid
- **Expense** — Expenses with approval state, Day wise, Designation wise,
  Standard Fare Chart, SFC Approval, Expense Month Maintenance
- **Sales** — Firms (with KYC), Orders with product lines and totals, Rate
  Master, Target across 7 tabs, Firm Monthly, Stock Month Maintenance
- **Business** — Doctor Business, Firm Business
- **Products** — catalogue with MRP/PTR/PTS, Product With QR
- **HR** — Leave Management, Entitlements, Leave Report
- **Reports** — Call Report, Visit Tracker, All India Daily Call Report,
  Employee Daily Performance, Expense Report, Leave Report. All take a date
  range and employee filter and export to CSV.
- **Also** — Sample Request, Reminders, Support tickets, E-detailing
  presentations and media, and four settings groups (Branding, General,
  Terminology, Approval & Email)

## Not built yet

These routes exist and say so on the page, listing what they will hold:
Secondary Sales (Stock Tally), Files, PayRoll, Insurance,
Accounting & Inventory, Account & Billing, Course Work, Hiringlane.

They need either a storage backend (Files), a module of their own
(PayRoll, Insurance, Accounting), or a data model that has no equivalent yet
(Stock Tally).

Beyond those, the source app also has geo-tracking of field staff, attendance
capture from the phone, and offline sync — all of which belong to the mobile
app rather than this admin UI.

## Checks

- `npm run build`
- `npx tsc --noEmit`
- `npx eslint src eslint.config.mjs`
- Browser: all 58 routes in both workspaces load with no runtime errors, and a
  full create → search → edit → delete cycle was verified against the live
  database. Test records were removed afterwards; the `/sfa` collections start
  empty.
