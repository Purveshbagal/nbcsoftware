import { getNextSequence } from "@/models/Counter";
import EmployeeModel from "@/models/Employee";

/**
 * Generates a unique employee ID in the format: EMP001, EMP002, EMP003, etc.
 * Ensures no duplicate IDs are generated using sequential counter.
 */
export async function generateEmployeeId(): Promise<string> {
  // Keep trying until we get a unique ID (handles race conditions)
  while (true) {
    const seq = await getNextSequence("employeeId");
    const employeeId = `EMP${String(seq).padStart(3, "0")}`;

    // Check if this ID already exists
    const existing = await EmployeeModel.findOne({ code: employeeId }).lean();
    if (!existing) {
      return employeeId;
    }

    // If exists, the loop will try again with next sequence number
  }
}
