import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorSpecialitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

doctorSpecialitySchema.index({ name: 1 });

export type DoctorSpeciality = InferSchemaType<typeof doctorSpecialitySchema>;

const DoctorSpecialityModel =
  mongoose.models.DoctorSpeciality ||
  mongoose.model("DoctorSpeciality", doctorSpecialitySchema);

// Auto-populate specialities on first connection
const DEFAULT_SPECIALITIES = [
  "General Physician", "General Medicine", "Internal Medicine", "Family Medicine", "General Surgeon",
  "Laparoscopic Surgeon", "Cardiologist", "Cardiac Surgeon", "Neurologist", "Neurosurgeon",
  "Orthopedic Surgeon", "Spine Surgeon", "Pediatrician", "Neonatologist", "Gynecologist",
  "Obstetrician", "Obstetrician and Gynecologist", "Fertility Specialist", "IVF Specialist",
  "Urologist", "Nephrologist", "Medical Oncologist", "Surgical Oncologist", "Radiation Oncologist",
  "Hematologist", "Dermatologist", "Cosmetologist", "Plastic Surgeon", "Reconstructive Surgeon",
  "Burn Surgeon", "Ophthalmologist", "Eye Surgeon", "ENT Specialist", "Otolaryngologist", "Dentist",
  "Orthodontist", "Endodontist", "Periodontist", "Prosthodontist", "Oral and Maxillofacial Surgeon",
  "Pediatric Dentist", "Oral Medicine Specialist", "Pulmonologist", "Respiratory Medicine Specialist",
  "Chest Physician", "Gastroenterologist", "Hepatologist", "Colorectal Surgeon", "Proctologist",
  "Endocrinologist", "Diabetologist", "Rheumatologist", "Immunologist", "Allergist",
  "Infectious Disease Specialist", "Critical Care Specialist", "Intensivist", "Anesthesiologist",
  "Pain Management Specialist", "Emergency Medicine Specialist", "Radiologist",
  "Interventional Radiologist", "Nuclear Medicine Specialist", "Pathologist", "Clinical Pathologist",
  "Microbiologist", "Forensic Medicine Specialist", "Psychiatrist", "Child Psychiatrist",
  "Geriatric Psychiatrist", "Psychologist", "Clinical Psychologist", "Neuropsychiatrist",
  "Geriatrician", "Palliative Care Specialist", "Sports Medicine Specialist",
  "Physical Medicine and Rehabilitation Specialist", "Physiatrist", "Physiotherapist",
  "Occupational Therapist", "Speech Therapist", "Audiologist", "Sleep Medicine Specialist",
  "Preventive Medicine Specialist", "Community Medicine Specialist", "Public Health Specialist",
  "Occupational Health Physician", "Aviation Medicine Specialist", "Sports Physician",
  "Transfusion Medicine Specialist", "Clinical Geneticist", "Medical Geneticist", "Andrologist",
  "Sexologist", "Venereologist", "Leprosy Specialist", "Tropical Medicine Specialist",
  "Ayurvedic Doctor", "Homeopathic Doctor", "Unani Doctor", "Siddha Doctor",
  "Yoga and Naturopathy Doctor", "Veterinary Doctor", "Dental Surgeon", "Oral Surgeon",
  "Bariatric Surgeon", "Vascular Surgeon", "Thoracic Surgeon", "Cardiothoracic Surgeon",
  "Pediatric Surgeon", "Pediatric Cardiologist", "Pediatric Neurologist",
  "Pediatric Gastroenterologist", "Pediatric Endocrinologist", "Pediatric Nephrologist",
  "Pediatric Pulmonologist", "Pediatric Hematologist", "Pediatric Oncologist",
  "Fetal Medicine Specialist", "Maternal-Fetal Medicine Specialist", "Reproductive Medicine Specialist",
  "High-Risk Pregnancy Specialist", "Breast Surgeon", "Endocrine Surgeon", "Hepatobiliary Surgeon",
  "Pancreatic Surgeon", "Transplant Surgeon", "Organ Transplant Specialist",
  "Kidney Transplant Specialist", "Liver Transplant Specialist", "Cornea Specialist",
  "Retina Specialist", "Glaucoma Specialist", "Neuro-Ophthalmologist", "Oculoplastic Surgeon",
  "Vitreo-Retinal Surgeon", "Medical Retina Specialist", "Pediatric Ophthalmologist",
  "Head and Neck Surgeon", "Skull Base Surgeon", "Cochlear Implant Surgeon", "Rhinologist",
  "Laryngologist", "Neurotologist", "Hand Surgeon", "Foot and Ankle Surgeon",
  "Joint Replacement Surgeon", "Arthroscopy Specialist", "Trauma Surgeon",
  "Surgical Gastroenterologist", "Medical Gastroenterologist", "Interventional Cardiologist",
  "Electrophysiologist", "Heart Failure Specialist", "Cardiac Electrophysiologist",
  "Clinical Hematologist", "Clinical Immunologist", "Allergy Specialist", "Clinical Pharmacologist",
  "Pharmacologist", "Biochemist", "Medical Biochemist", "Anatomical Pathologist",
  "Histopathologist", "Cytopathologist", "Dermatopathologist", "Neuropathologist",
  "Hematopathologist", "Molecular Pathologist", "Emergency Physician", "Hospitalist",
  "Medical Officer", "General Duty Medical Officer", "Resident Medical Officer", "Consultant Physician"
];

// Initialize default specialities if collection is empty
if (mongoose.connection.readyState === 1) {
  DoctorSpecialityModel.countDocuments()
    .then(async (count) => {
      if (count === 0) {
        const specialities = DEFAULT_SPECIALITIES.map((name) => ({ name }));
        await DoctorSpecialityModel.insertMany(specialities);
        console.log(`✅ Auto-seeded ${specialities.length} specialities`);
      }
    })
    .catch((err) => console.error("Error auto-seeding specialities:", err));
}

export default DoctorSpecialityModel;
