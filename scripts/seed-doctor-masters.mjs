import "dotenv/config";
import mongoose from "mongoose";

const QUALIFICATIONS = [
  "MBBS",
  "MD",
  "MS",
  "DNB",
  "DM",
  "MCh",
  "BAMS",
  "BHMS",
  "BDS",
  "MDS",
  "BPT",
  "MPT",
  "BUMS",
  "B.Sc Nursing",
  "M.Sc Nursing",
  "Pharm.D",
  "B.Pharm",
  "M.Pharm",
  "DO",
  "DCH",
  "DDVL",
  "DVD",
  "DOMS",
  "DA",
  "DTCD",
  "DGO",
  "DPM",
  "FCPS",
  "FRCS",
  "MRCP",
  "MRCS",
];

const SPECIALITIES = [
  "General Medicine",
  "General Surgery",
  "Pediatrics",
  "Obstetrics and Gynecology",
  "Orthopedics",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Psychiatry",
  "Ophthalmology",
  "ENT (Ear, Nose, Throat)",
  "Radiology",
  "Pathology",
  "Anesthesiology",
  "Emergency Medicine",
  "Nephrology",
  "Urology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology",
  "Rheumatology",
  "Oncology",
  "Hematology",
  "Plastic Surgery",
  "Neurosurgery",
  "Cardiothoracic Surgery",
  "Vascular Surgery",
  "Pediatric Surgery",
  "Dentistry",
  "Orthodontics",
  "Oral and Maxillofacial Surgery",
  "Periodontics",
  "Prosthodontics",
  "Endodontics",
  "Physiotherapy",
  "Ayurveda",
  "Homeopathy",
  "Unani",
  "General Practitioner",
];

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  process.exit(1);
}

const qualificationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { username: String, name: String },
}, { timestamps: true });

const specialitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { username: String, name: String },
}, { timestamps: true });

const DoctorQualification = mongoose.models.DoctorQualification ||
  mongoose.model("DoctorQualification", qualificationSchema);

const DoctorSpeciality = mongoose.models.DoctorSpeciality ||
  mongoose.model("DoctorSpeciality", specialitySchema);

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n📚 Seeding Doctor Qualifications...");
    let qualCount = 0;
    for (const name of QUALIFICATIONS) {
      const existing = await DoctorQualification.findOne({ name });
      if (!existing) {
        await DoctorQualification.create({
          name,
          description: `${name} qualification`,
          createdBy: { username: "system", name: "System" },
        });
        qualCount++;
      }
    }
    console.log(`✅ Added ${qualCount} new qualifications (${QUALIFICATIONS.length - qualCount} already existed)`);

    console.log("\n🏥 Seeding Doctor Specialities...");
    let specCount = 0;
    for (const name of SPECIALITIES) {
      const existing = await DoctorSpeciality.findOne({ name });
      if (!existing) {
        await DoctorSpeciality.create({
          name,
          description: `${name} speciality`,
          createdBy: { username: "system", name: "System" },
        });
        specCount++;
      }
    }
    console.log(`✅ Added ${specCount} new specialities (${SPECIALITIES.length - specCount} already existed)`);

    console.log("\n✨ Seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

seed();
