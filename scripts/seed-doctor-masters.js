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

// Doctor Qualifications - User Provided List
const qualifications = [
  "MBBS", "MD", "MS", "DNB", "DrNB", "DM", "MCh", "DCH", "DGO", "DLO", "DA", "DVD", "DDVL", "DTCD", "DPM", "DCP", "D.Ortho", "DOMS", "DO", "M.D. (Medicine)", "M.D. (Pediatrics)", "M.D. (Dermatology)", "M.D. (Psychiatry)", "M.D. (Radiology)", "M.D. (Pathology)", "M.D. (Anesthesia)", "M.D. (Community Medicine)", "M.D. (Respiratory Medicine)", "M.D. (Emergency Medicine)", "M.S. (General Surgery)", "M.S. (Orthopedics)", "M.S. (Ophthalmology)", "M.S. (ENT)", "M.S. (Obstetrics and Gynecology)", "M.S. (Anatomy)", "M.S. (Physiology)", "M.S. (Biochemistry)", "M.S. (Pharmacology)", "M.S. (Microbiology)", "M.S. (Forensic Medicine)", "BDS", "MDS", "BAMS", "MD (Ayurveda)", "MS (Ayurveda)", "BUMS", "MD (Unani)", "BSMS", "MD (Siddha)", "BNYS", "BHMS", "MD (Homoeopathy)", "PGDHM", "PG Diploma", "PGDM", "FNB", "PhD", "M.Phil", "MPH", "MHA", "BPT", "MPT", "BOT", "MOT", "B.Sc. Nursing", "M.Sc. Nursing", "GNM", "ANM", "BASLP", "MASLP", "B.Sc. Optometry", "M.Optom", "B.V.Sc.", "M.V.Sc.", "Pharm.D", "B.Pharm", "M.Pharm"
].map(name => ({ name }));

// Doctor Specialities - User Provided List
const specialities = [
  "General Physician", "General Medicine", "Internal Medicine", "Family Medicine", "General Surgeon", "Laparoscopic Surgeon", "Cardiologist", "Cardiac Surgeon", "Neurologist", "Neurosurgeon", "Orthopedic Surgeon", "Spine Surgeon", "Pediatrician", "Neonatologist", "Gynecologist", "Obstetrician", "Obstetrician and Gynecologist", "Fertility Specialist", "IVF Specialist", "Urologist", "Nephrologist", "Medical Oncologist", "Surgical Oncologist", "Radiation Oncologist", "Hematologist", "Dermatologist", "Cosmetologist", "Plastic Surgeon", "Reconstructive Surgeon", "Burn Surgeon", "Ophthalmologist", "Eye Surgeon", "ENT Specialist", "Otolaryngologist", "Dentist", "Orthodontist", "Endodontist", "Periodontist", "Prosthodontist", "Oral and Maxillofacial Surgeon", "Pediatric Dentist", "Oral Medicine Specialist", "Pulmonologist", "Respiratory Medicine Specialist", "Chest Physician", "Gastroenterologist", "Hepatologist", "Colorectal Surgeon", "Proctologist", "Endocrinologist", "Diabetologist", "Rheumatologist", "Immunologist", "Allergist", "Infectious Disease Specialist", "Critical Care Specialist", "Intensivist", "Anesthesiologist", "Pain Management Specialist", "Emergency Medicine Specialist", "Radiologist", "Interventional Radiologist", "Nuclear Medicine Specialist", "Pathologist", "Clinical Pathologist", "Microbiologist", "Forensic Medicine Specialist", "Psychiatrist", "Child Psychiatrist", "Geriatric Psychiatrist", "Psychologist", "Clinical Psychologist", "Neuropsychiatrist", "Geriatrician", "Palliative Care Specialist", "Sports Medicine Specialist", "Physical Medicine and Rehabilitation Specialist", "Physiatrist", "Physiotherapist", "Occupational Therapist", "Speech Therapist", "Audiologist", "Sleep Medicine Specialist", "Preventive Medicine Specialist", "Community Medicine Specialist", "Public Health Specialist", "Occupational Health Physician", "Aviation Medicine Specialist", "Sports Physician", "Transfusion Medicine Specialist", "Clinical Geneticist", "Medical Geneticist", "Andrologist", "Sexologist", "Venereologist", "Leprosy Specialist", "Tropical Medicine Specialist", "Ayurvedic Doctor", "Homeopathic Doctor", "Unani Doctor", "Siddha Doctor", "Yoga and Naturopathy Doctor", "Veterinary Doctor", "Dental Surgeon", "Oral Surgeon", "Bariatric Surgeon", "Vascular Surgeon", "Thoracic Surgeon", "Cardiothoracic Surgeon", "Pediatric Surgeon", "Pediatric Cardiologist", "Pediatric Neurologist", "Pediatric Gastroenterologist", "Pediatric Endocrinologist", "Pediatric Nephrologist", "Pediatric Pulmonologist", "Pediatric Hematologist", "Pediatric Oncologist", "Fetal Medicine Specialist", "Maternal-Fetal Medicine Specialist", "Reproductive Medicine Specialist", "High-Risk Pregnancy Specialist", "Breast Surgeon", "Endocrine Surgeon", "Hepatobiliary Surgeon", "Pancreatic Surgeon", "Transplant Surgeon", "Organ Transplant Specialist", "Kidney Transplant Specialist", "Liver Transplant Specialist", "Cornea Specialist", "Retina Specialist", "Glaucoma Specialist", "Neuro-Ophthalmologist", "Oculoplastic Surgeon", "Vitreo-Retinal Surgeon", "Medical Retina Specialist", "Pediatric Ophthalmologist", "Head and Neck Surgeon", "Skull Base Surgeon", "Cochlear Implant Surgeon", "Rhinologist", "Laryngologist", "Neurotologist", "Hand Surgeon", "Foot and Ankle Surgeon", "Joint Replacement Surgeon", "Arthroscopy Specialist", "Trauma Surgeon", "Surgical Gastroenterologist", "Medical Gastroenterologist", "Interventional Cardiologist", "Electrophysiologist", "Heart Failure Specialist", "Cardiac Electrophysiologist", "Clinical Hematologist", "Clinical Immunologist", "Allergy Specialist", "Clinical Pharmacologist", "Pharmacologist", "Biochemist", "Medical Biochemist", "Anatomical Pathologist", "Histopathologist", "Cytopathologist", "Dermatopathologist", "Neuropathologist", "Hematopathologist", "Molecular Pathologist", "Emergency Physician", "Hospitalist", "Medical Officer", "General Duty Medical Officer", "Resident Medical Officer", "Consultant Physician"
].map(name => ({ name }));

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
