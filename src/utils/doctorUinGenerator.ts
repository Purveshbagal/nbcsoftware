import DoctorModel from "@/models/Doctor";
import RegistrationModel from "@/models/Registration";
import { getNextSequence } from "@/models/Counter";

/**
 * Centralized UIN ID generation utility for doctors across all apps
 * Ensures no duplicate UIN IDs are generated regardless of source (racer, survey, web)
 */

interface UinIdGenerationOptions {
  prefix?: string; // Optional prefix override (default: auto-detect based on source)
  source: "racer" | "survey" | "web" | "mobile_app";
}

/**
 * Get the appropriate prefix based on the source
 * ALL sources now use MH prefix for unified doctor identification
 */
function getPrefixForSource(source: string): string {
  // Both mobile labs (racer) and survey apps use MH prefix
  // This ensures no duplicate IDs across apps
  return "MH";
}

/**
 * Generate a unique UIN ID for a doctor
 * This function checks ALL existing doctors AND registrations across all sources to ensure uniqueness
 *
 * @param options - Configuration options for UIN generation
 * @returns Promise<string> - Generated unique UIN ID
 */
export async function generateDoctorUinId(
  options: UinIdGenerationOptions
): Promise<string> {
  const prefix = options.prefix || getPrefixForSource(options.source);

  // Find the last doctor UIN in the Doctor model
  const lastDoctor = await DoctorModel.findOne({
    uinId: { $regex: `^${prefix}\\d+$` },
  })
    .sort({ uinId: -1 })
    .select("uinId")
    .lean();

  // Find the last doctor ID in the Registration model (survey app)
  const lastRegistration = await RegistrationModel.findOne({
    doctorId: { $regex: `^${prefix}\\d+$` },
  })
    .sort({ doctorId: -1 })
    .select("doctorId")
    .lean();

  let nextNumber = 1;

  // Check Doctor model
  if (lastDoctor?.uinId) {
    const lastNumber = parseInt(lastDoctor.uinId.substring(prefix.length), 10);
    nextNumber = Math.max(nextNumber, lastNumber + 1);
  }

  // Check Registration model
  if (lastRegistration?.doctorId) {
    const lastNumber = parseInt(lastRegistration.doctorId.substring(prefix.length), 10);
    nextNumber = Math.max(nextNumber, lastNumber + 1);
  }

  // Generate the UIN ID with zero-padding (3 digits minimum)
  const uinId = `${prefix}${String(nextNumber).padStart(3, "0")}`;

  // Double-check for uniqueness in BOTH models (race condition prevention)
  const [existingDoctor, existingRegistration] = await Promise.all([
    DoctorModel.findOne({ uinId }).lean(),
    RegistrationModel.findOne({ doctorId: uinId }).lean(),
  ]);

  if (existingDoctor || existingRegistration) {
    // If somehow we got a duplicate, recursively try the next number
    console.warn(
      `UIN ID ${uinId} already exists in ${existingDoctor ? 'Doctor' : 'Registration'} model, generating next sequential ID`
    );
    return generateDoctorUinId({
      ...options,
      prefix: `${prefix}${String(nextNumber + 1).padStart(3, "0")}`,
    });
  }

  return uinId;
}

/**
 * Validate if a UIN ID is unique across all doctors and registrations
 *
 * @param uinId - The UIN ID to validate
 * @returns Promise<boolean> - True if unique, false if already exists
 */
export async function isUinIdUnique(uinId: string): Promise<boolean> {
  const [existingDoctor, existingRegistration] = await Promise.all([
    DoctorModel.findOne({ uinId }).lean(),
    RegistrationModel.findOne({ doctorId: uinId }).lean(),
  ]);
  return !existingDoctor && !existingRegistration;
}

/**
 * Get the next available UIN ID for a given prefix
 * This is a convenience function that checks globally across all doctors and registrations
 *
 * @param prefix - The prefix to use (e.g., "MH")
 * @returns Promise<string> - Next available UIN ID
 */
export async function getNextAvailableUinId(prefix: string): Promise<string> {
  const [lastDoctor, lastRegistration] = await Promise.all([
    DoctorModel.findOne({ uinId: { $regex: `^${prefix}\\d+$` } })
      .sort({ uinId: -1 })
      .select("uinId")
      .lean(),
    RegistrationModel.findOne({ doctorId: { $regex: `^${prefix}\\d+$` } })
      .sort({ doctorId: -1 })
      .select("doctorId")
      .lean(),
  ]);

  let nextNumber = 1;

  if (lastDoctor?.uinId) {
    const lastNumber = parseInt(lastDoctor.uinId.substring(prefix.length), 10);
    nextNumber = Math.max(nextNumber, lastNumber + 1);
  }

  if (lastRegistration?.doctorId) {
    const lastNumber = parseInt(lastRegistration.doctorId.substring(prefix.length), 10);
    nextNumber = Math.max(nextNumber, lastNumber + 1);
  }

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Get all UIN IDs currently in use across both Doctor and Registration models
 * Useful for debugging and reporting
 *
 * @returns Promise<string[]> - Array of all UIN IDs
 */
export async function getAllUinIds(): Promise<string[]> {
  const [doctors, registrations] = await Promise.all([
    DoctorModel.find({ uinId: { $exists: true, $ne: null } })
      .select("uinId")
      .lean(),
    RegistrationModel.find({ doctorId: { $exists: true, $ne: null } })
      .select("doctorId")
      .lean(),
  ]);

  const doctorUinIds = doctors.map((d) => d.uinId).filter((id): id is string => !!id);
  const registrationIds = registrations.map((r) => r.doctorId).filter((id): id is string => !!id);

  return [...doctorUinIds, ...registrationIds];
}

/**
 * Get UIN ID statistics by prefix
 *
 * @returns Promise<Record<string, number>> - Count of UIN IDs per prefix
 */
export async function getUinIdStats(): Promise<Record<string, number>> {
  const allUinIds = await getAllUinIds();
  const stats: Record<string, number> = {};

  for (const uinId of allUinIds) {
    // Extract prefix (first 2 characters)
    const prefix = uinId.substring(0, 2);
    stats[prefix] = (stats[prefix] || 0) + 1;
  }

  return stats;
}
