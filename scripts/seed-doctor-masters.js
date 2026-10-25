/**
 * Seed script for India Doctor Qualifications and Specialities
 * Run: node scripts/seed-doctor-masters.js
 */

const mongoose = require("mongoose");

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ptoject";

const qualificationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String }, // UG, PG, Super-Specialty, Alternative
});

const specialitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String }, // Medical, Surgical, Super-Specialty
});

const DoctorQualification = mongoose.model("DoctorQualification", qualificationSchema);
const DoctorSpeciality = mongoose.model("DoctorSpeciality", specialitySchema);

// Comprehensive India Doctor Qualifications
const qualifications = [
  // Undergraduate - Modern Medicine
  { name: "MBBS", category: "UG" },
  { name: "BDS", category: "UG" },
  { name: "BPT", category: "UG" },
  { name: "B.Sc Nursing", category: "UG" },
  { name: "BUMS", category: "UG - Alternative" },
  { name: "BAMS", category: "UG - Alternative" },
  { name: "BHMS", category: "UG - Alternative" },
  { name: "BNYS", category: "UG - Alternative" },
  { name: "BVSc", category: "UG - Veterinary" },

  // Postgraduate - Medical
  { name: "MD (General Medicine)", category: "PG - Medical" },
  { name: "MD (Pediatrics)", category: "PG - Medical" },
  { name: "MD (Dermatology)", category: "PG - Medical" },
  { name: "MD (Psychiatry)", category: "PG - Medical" },
  { name: "MD (Anesthesiology)", category: "PG - Medical" },
  { name: "MD (Radiology)", category: "PG - Medical" },
  { name: "MD (Pathology)", category: "PG - Medical" },
  { name: "MD (Microbiology)", category: "PG - Medical" },
  { name: "MD (Pharmacology)", category: "PG - Medical" },
  { name: "MD (Biochemistry)", category: "PG - Medical" },
  { name: "MD (Physiology)", category: "PG - Medical" },
  { name: "MD (Anatomy)", category: "PG - Medical" },
  { name: "MD (Forensic Medicine)", category: "PG - Medical" },
  { name: "MD (Community Medicine)", category: "PG - Medical" },
  { name: "MD (Respiratory Medicine)", category: "PG - Medical" },
  { name: "MD (Tuberculosis & Chest)", category: "PG - Medical" },
  { name: "MD (Tropical Medicine)", category: "PG - Medical" },
  { name: "MD (Geriatrics)", category: "PG - Medical" },
  { name: "MD (Palliative Medicine)", category: "PG - Medical" },
  { name: "MD (Transfusion Medicine)", category: "PG - Medical" },
  { name: "MD (Nuclear Medicine)", category: "PG - Medical" },
  { name: "MD (Physical Medicine & Rehabilitation)", category: "PG - Medical" },
  { name: "MD (Sports Medicine)", category: "PG - Medical" },

  // Postgraduate - Surgical
  { name: "MS (General Surgery)", category: "PG - Surgical" },
  { name: "MS (Orthopedics)", category: "PG - Surgical" },
  { name: "MS (ENT)", category: "PG - Surgical" },
  { name: "MS (Ophthalmology)", category: "PG - Surgical" },
  { name: "MS (Obstetrics & Gynecology)", category: "PG - Surgical" },
  { name: "MS (Anatomy)", category: "PG - Surgical" },

  // DNB - Postgraduate
  { name: "DNB (General Medicine)", category: "PG - DNB" },
  { name: "DNB (Pediatrics)", category: "PG - DNB" },
  { name: "DNB (General Surgery)", category: "PG - DNB" },
  { name: "DNB (Orthopedics)", category: "PG - DNB" },
  { name: "DNB (Obstetrics & Gynecology)", category: "PG - DNB" },
  { name: "DNB (Anesthesiology)", category: "PG - DNB" },
  { name: "DNB (Radiology)", category: "PG - DNB" },
  { name: "DNB (Dermatology)", category: "PG - DNB" },
  { name: "DNB (Ophthalmology)", category: "PG - DNB" },
  { name: "DNB (ENT)", category: "PG - DNB" },
  { name: "DNB (Pathology)", category: "PG - DNB" },
  { name: "DNB (Psychiatry)", category: "PG - DNB" },

  // Diploma Courses
  { name: "Diploma in Child Health (DCH)", category: "Diploma" },
  { name: "Diploma in Obstetrics & Gynecology (DGO)", category: "Diploma" },
  { name: "Diploma in Anesthesia (DA)", category: "Diploma" },
  { name: "Diploma in Orthopedics (D.Ortho)", category: "Diploma" },
  { name: "Diploma in Ophthalmology (DO)", category: "Diploma" },
  { name: "Diploma in Otorhinolaryngology (DLO)", category: "Diploma" },
  { name: "Diploma in Dermatology, Venereology & Leprosy (DDVL)", category: "Diploma" },
  { name: "Diploma in Tuberculosis & Chest Diseases (DTCD)", category: "Diploma" },
  { name: "Diploma in Psychological Medicine (DPM)", category: "Diploma" },
  { name: "Diploma in Medical Radio Diagnosis (DMRD)", category: "Diploma" },
  { name: "Diploma in Clinical Pathology (DCP)", category: "Diploma" },

  // Super-Specialty - DM (Medical)
  { name: "DM (Cardiology)", category: "Super-Specialty - Medical" },
  { name: "DM (Neurology)", category: "Super-Specialty - Medical" },
  { name: "DM (Gastroenterology)", category: "Super-Specialty - Medical" },
  { name: "DM (Nephrology)", category: "Super-Specialty - Medical" },
  { name: "DM (Endocrinology)", category: "Super-Specialty - Medical" },
  { name: "DM (Medical Oncology)", category: "Super-Specialty - Medical" },
  { name: "DM (Hematology)", category: "Super-Specialty - Medical" },
  { name: "DM (Infectious Diseases)", category: "Super-Specialty - Medical" },
  { name: "DM (Rheumatology)", category: "Super-Specialty - Medical" },
  { name: "DM (Clinical Immunology)", category: "Super-Specialty - Medical" },
  { name: "DM (Critical Care Medicine)", category: "Super-Specialty - Medical" },
  { name: "DM (Pulmonary Medicine)", category: "Super-Specialty - Medical" },
  { name: "DM (Clinical Hematology)", category: "Super-Specialty - Medical" },
  { name: "DM (Clinical Pharmacology)", category: "Super-Specialty - Medical" },
  { name: "DM (Hepatology)", category: "Super-Specialty - Medical" },
  { name: "DM (Neonatology)", category: "Super-Specialty - Medical" },

  // Super-Specialty - MCh (Surgical)
  { name: "MCh (Neurosurgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Urology)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Cardiothoracic & Vascular Surgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Surgical Gastroenterology)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Plastic Surgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Pediatric Surgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Surgical Oncology)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Hand Surgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Vascular Surgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Endocrine Surgery)", category: "Super-Specialty - Surgical" },
  { name: "MCh (Reconstructive Surgery)", category: "Super-Specialty - Surgical" },

  // Super-Specialty DNB
  { name: "DNB-SS (Cardiology)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Neurology)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Gastroenterology)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Nephrology)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Neurosurgery)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Urology)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Plastic Surgery)", category: "Super-Specialty - DNB" },
  { name: "DNB-SS (Surgical Gastroenterology)", category: "Super-Specialty - DNB" },

  // Dental
  { name: "MDS (Orthodontics)", category: "PG - Dental" },
  { name: "MDS (Oral & Maxillofacial Surgery)", category: "PG - Dental" },
  { name: "MDS (Prosthodontics)", category: "PG - Dental" },
  { name: "MDS (Periodontics)", category: "PG - Dental" },
  { name: "MDS (Pedodontics)", category: "PG - Dental" },
  { name: "MDS (Oral Medicine & Radiology)", category: "PG - Dental" },
  { name: "MDS (Oral Pathology)", category: "PG - Dental" },
  { name: "MDS (Conservative Dentistry & Endodontics)", category: "PG - Dental" },

  // Alternative Medicine PG
  { name: "MD (Ayurveda)", category: "PG - Alternative" },
  { name: "MD (Homeopathy)", category: "PG - Alternative" },
  { name: "MD (Unani)", category: "PG - Alternative" },
  { name: "MS (Ayurveda)", category: "PG - Alternative" },

  // Others
  { name: "MPH (Master of Public Health)", category: "PG - Others" },
  { name: "M.Sc (Medical)", category: "PG - Others" },
  { name: "Fellowship (Various)", category: "Fellowship" },
  { name: "FRCS", category: "Fellowship" },
  { name: "MRCP", category: "Fellowship" },
  { name: "FCPS", category: "Fellowship" },
];

// Comprehensive India Medical Specialities
const specialities = [
  // General & Primary Care
  { name: "General Physician", category: "General" },
  { name: "General Practitioner", category: "General" },
  { name: "Family Medicine", category: "General" },
  { name: "Internal Medicine", category: "Medical" },

  // Medical Specialties
  { name: "Cardiology", category: "Medical" },
  { name: "Neurology", category: "Medical" },
  { name: "Gastroenterology", category: "Medical" },
  { name: "Pulmonology", category: "Medical" },
  { name: "Nephrology", category: "Medical" },
  { name: "Endocrinology", category: "Medical" },
  { name: "Rheumatology", category: "Medical" },
  { name: "Hematology", category: "Medical" },
  { name: "Oncology (Medical)", category: "Medical" },
  { name: "Infectious Diseases", category: "Medical" },
  { name: "Diabetology", category: "Medical" },
  { name: "Geriatrics", category: "Medical" },
  { name: "Palliative Medicine", category: "Medical" },
  { name: "Tropical Medicine", category: "Medical" },
  { name: "Clinical Immunology", category: "Medical" },
  { name: "Hepatology", category: "Medical" },
  { name: "Critical Care Medicine", category: "Medical" },
  { name: "Emergency Medicine", category: "Medical" },

  // Surgical Specialties
  { name: "General Surgery", category: "Surgical" },
  { name: "Orthopedics", category: "Surgical" },
  { name: "Neurosurgery", category: "Surgical" },
  { name: "Cardiothoracic Surgery", category: "Surgical" },
  { name: "Vascular Surgery", category: "Surgical" },
  { name: "Plastic Surgery", category: "Surgical" },
  { name: "Urology", category: "Surgical" },
  { name: "Surgical Gastroenterology", category: "Surgical" },
  { name: "Surgical Oncology", category: "Surgical" },
  { name: "Pediatric Surgery", category: "Surgical" },
  { name: "Laparoscopic Surgery", category: "Surgical" },
  { name: "Bariatric Surgery", category: "Surgical" },
  { name: "Trauma Surgery", category: "Surgical" },
  { name: "Hand Surgery", category: "Surgical" },
  { name: "Colorectal Surgery", category: "Surgical" },
  { name: "Endocrine Surgery", category: "Surgical" },
  { name: "Transplant Surgery", category: "Surgical" },

  // Women & Child
  { name: "Obstetrics & Gynecology", category: "Women & Child" },
  { name: "Pediatrics", category: "Women & Child" },
  { name: "Neonatology", category: "Women & Child" },
  { name: "Gynecologic Oncology", category: "Women & Child" },
  { name: "Maternal-Fetal Medicine", category: "Women & Child" },
  { name: "Reproductive Medicine", category: "Women & Child" },
  { name: "IVF Specialist", category: "Women & Child" },
  { name: "Pediatric Cardiology", category: "Women & Child" },
  { name: "Pediatric Neurology", category: "Women & Child" },
  { name: "Pediatric Gastroenterology", category: "Women & Child" },

  // Diagnostic & Supportive
  { name: "Radiology", category: "Diagnostic" },
  { name: "Pathology", category: "Diagnostic" },
  { name: "Microbiology", category: "Diagnostic" },
  { name: "Anesthesiology", category: "Supportive" },
  { name: "Pain Management", category: "Supportive" },
  { name: "Nuclear Medicine", category: "Diagnostic" },
  { name: "Transfusion Medicine", category: "Supportive" },

  // Sensory Organs
  { name: "Ophthalmology", category: "Sensory" },
  { name: "ENT (Otorhinolaryngology)", category: "Sensory" },
  { name: "Dentistry", category: "Dental" },
  { name: "Orthodontics", category: "Dental" },
  { name: "Oral & Maxillofacial Surgery", category: "Dental" },
  { name: "Prosthodontics", category: "Dental" },
  { name: "Periodontics", category: "Dental" },
  { name: "Pedodontics", category: "Dental" },
  { name: "Endodontics", category: "Dental" },
  { name: "Oral Pathology", category: "Dental" },
  { name: "Oral Medicine", category: "Dental" },

  // Skin & Cosmetic
  { name: "Dermatology", category: "Skin & Cosmetic" },
  { name: "Venereology", category: "Skin & Cosmetic" },
  { name: "Leprosy", category: "Skin & Cosmetic" },
  { name: "Cosmetology", category: "Skin & Cosmetic" },
  { name: "Dermatosurgery", category: "Skin & Cosmetic" },
  { name: "Aesthetic Medicine", category: "Skin & Cosmetic" },

  // Mental Health
  { name: "Psychiatry", category: "Mental Health" },
  { name: "Clinical Psychology", category: "Mental Health" },
  { name: "Child Psychiatry", category: "Mental Health" },
  { name: "Addiction Medicine", category: "Mental Health" },
  { name: "Geriatric Psychiatry", category: "Mental Health" },

  // Rehabilitation & Therapy
  { name: "Physical Medicine & Rehabilitation", category: "Rehabilitation" },
  { name: "Physiotherapy", category: "Rehabilitation" },
  { name: "Occupational Therapy", category: "Rehabilitation" },
  { name: "Speech Therapy", category: "Rehabilitation" },
  { name: "Sports Medicine", category: "Rehabilitation" },

  // Alternative Medicine
  { name: "Ayurveda", category: "Alternative" },
  { name: "Homeopathy", category: "Alternative" },
  { name: "Unani", category: "Alternative" },
  { name: "Naturopathy", category: "Alternative" },
  { name: "Yoga & Naturopathy", category: "Alternative" },
  { name: "Acupuncture", category: "Alternative" },

  // Others
  { name: "Sexology", category: "Others" },
  { name: "Andrology", category: "Others" },
  { name: "Sleep Medicine", category: "Others" },
  { name: "Travel Medicine", category: "Others" },
  { name: "Forensic Medicine", category: "Others" },
  { name: "Community Medicine", category: "Others" },
  { name: "Public Health", category: "Others" },
  { name: "Occupational Medicine", category: "Others" },
  { name: "Aviation Medicine", category: "Others" },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await DoctorQualification.deleteMany({});
    await DoctorSpeciality.deleteMany({});
    console.log("Cleared existing data");

    // Insert qualifications
    await DoctorQualification.insertMany(qualifications);
    console.log(`✅ Inserted ${qualifications.length} qualifications`);

    // Insert specialities
    await DoctorSpeciality.insertMany(specialities);
    console.log(`✅ Inserted ${specialities.length} specialities`);

    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seed();
