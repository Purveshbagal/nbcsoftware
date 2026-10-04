import { connectToDatabase } from "@/lib/mongodb";
import DoctorModel from "@/models/Doctor";
import EmployeeModel from "@/models/Employee";
import FirmModel from "@/models/Firm";
import MasterItemModel from "@/models/MasterItem";

/**
 * Active entries of the given masters, keyed by master slug. Dropdowns across
 * the field-force workspace are fed from here so they always match Settings.
 */
export async function loadMasterOptions(
  types: string[]
): Promise<Record<string, string[]>> {
  await connectToDatabase();

  const items = await MasterItemModel.find({ type: { $in: types }, isActive: true })
    .select("type name sortOrder")
    .sort({ sortOrder: 1, name: 1 })
    .lean<{ type: string; name: string }[]>();

  const options: Record<string, string[]> = Object.fromEntries(
    types.map((type) => [type, [] as string[]])
  );
  for (const item of items) {
    options[item.type]?.push(item.name);
  }

  return options;
}

/** Names of active employees, for assignment dropdowns. */
export async function loadEmployeeNames(): Promise<string[]> {
  await connectToDatabase();
  const employees = await EmployeeModel.find({ isActive: true })
    .select("name")
    .sort({ name: 1 })
    .lean<{ name: string }[]>();
  return employees.map((employee) => employee.name);
}

/** Names of active firms. */
export async function loadFirmNames(): Promise<string[]> {
  await connectToDatabase();
  const firms = await FirmModel.find({ isActive: true })
    .select("name")
    .sort({ name: 1 })
    .lean<{ name: string }[]>();
  return firms.map((firm) => firm.name);
}

/** Names of active doctors. */
export async function loadDoctorNames(): Promise<string[]> {
  await connectToDatabase();
  const doctors = await DoctorModel.find({ isActive: true })
    .select("name")
    .sort({ name: 1 })
    .lean<{ name: string }[]>();
  return doctors.map((doctor) => doctor.name);
}

/** Distinct non-empty values already stored in a column, for filter dropdowns. */
export function distinctValues(rows: Record<string, unknown>[], key: string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (Array.isArray(value)) {
      for (const entry of value) if (entry) values.add(String(entry));
    } else if (value) {
      values.add(String(value));
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}
