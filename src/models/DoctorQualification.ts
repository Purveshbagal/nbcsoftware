import mongoose, { Schema, type InferSchemaType } from "mongoose";

const doctorQualificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

doctorQualificationSchema.index({ name: 1 });

export type DoctorQualification = InferSchemaType<typeof doctorQualificationSchema>;

const DoctorQualificationModel =
  mongoose.models.DoctorQualification ||
  mongoose.model("DoctorQualification", doctorQualificationSchema);

// Auto-populate qualifications on first connection
const DEFAULT_QUALIFICATIONS = [
  "MBBS", "MD", "MS", "DNB", "DrNB", "DM", "MCh", "DCH", "DGO", "DLO", "DA", "DVD", "DDVL",
  "DTCD", "DPM", "DCP", "D.Ortho", "DOMS", "DO", "M.D. (Medicine)", "M.D. (Pediatrics)",
  "M.D. (Dermatology)", "M.D. (Psychiatry)", "M.D. (Radiology)", "M.D. (Pathology)",
  "M.D. (Anesthesia)", "M.D. (Community Medicine)", "M.D. (Respiratory Medicine)",
  "M.D. (Emergency Medicine)", "M.S. (General Surgery)", "M.S. (Orthopedics)",
  "M.S. (Ophthalmology)", "M.S. (ENT)", "M.S. (Obstetrics and Gynecology)", "M.S. (Anatomy)",
  "M.S. (Physiology)", "M.S. (Biochemistry)", "M.S. (Pharmacology)", "M.S. (Microbiology)",
  "M.S. (Forensic Medicine)", "BDS", "MDS", "BAMS", "MD (Ayurveda)", "MS (Ayurveda)",
  "BUMS", "MD (Unani)", "BSMS", "MD (Siddha)", "BNYS", "BHMS", "MD (Homoeopathy)",
  "PGDHM", "PG Diploma", "PGDM", "FNB", "PhD", "M.Phil", "MPH", "MHA", "BPT", "MPT",
  "BOT", "MOT", "B.Sc. Nursing", "M.Sc. Nursing", "GNM", "ANM", "BASLP", "MASLP",
  "B.Sc. Optometry", "M.Optom", "B.V.Sc.", "M.V.Sc.", "Pharm.D", "B.Pharm", "M.Pharm"
];

// Initialize default qualifications if collection is empty
if (mongoose.connection.readyState === 1) {
  DoctorQualificationModel.countDocuments()
    .then(async (count) => {
      if (count === 0) {
        const qualifications = DEFAULT_QUALIFICATIONS.map((name) => ({ name }));
        await DoctorQualificationModel.insertMany(qualifications);
        console.log(`✅ Auto-seeded ${qualifications.length} qualifications`);
      }
    })
    .catch((err) => console.error("Error auto-seeding qualifications:", err));
}

export default DoctorQualificationModel;
