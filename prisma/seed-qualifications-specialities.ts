import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive list of medical qualifications
const qualifications = [
  // Basic Medical Degrees
  { name: 'MBBS', description: 'Bachelor of Medicine, Bachelor of Surgery' },
  { name: 'BDS', description: 'Bachelor of Dental Surgery' },
  { name: 'BAMS', description: 'Bachelor of Ayurvedic Medicine and Surgery' },
  { name: 'BHMS', description: 'Bachelor of Homeopathic Medicine and Surgery' },
  { name: 'BUMS', description: 'Bachelor of Unani Medicine and Surgery' },
  { name: 'BNYS', description: 'Bachelor of Naturopathy and Yogic Sciences' },
  { name: 'BVSc', description: 'Bachelor of Veterinary Science' },
  { name: 'B.Pharm', description: 'Bachelor of Pharmacy' },
  { name: 'B.Sc Nursing', description: 'Bachelor of Science in Nursing' },

  // Postgraduate Degrees (MD)
  { name: 'MD (General Medicine)', description: 'Doctor of Medicine in General Medicine' },
  { name: 'MD (Pediatrics)', description: 'Doctor of Medicine in Pediatrics' },
  { name: 'MD (Dermatology)', description: 'Doctor of Medicine in Dermatology' },
  { name: 'MD (Psychiatry)', description: 'Doctor of Medicine in Psychiatry' },
  { name: 'MD (Anesthesiology)', description: 'Doctor of Medicine in Anesthesiology' },
  { name: 'MD (Radiology)', description: 'Doctor of Medicine in Radiology' },
  { name: 'MD (Pathology)', description: 'Doctor of Medicine in Pathology' },
  { name: 'MD (Microbiology)', description: 'Doctor of Medicine in Microbiology' },
  { name: 'MD (Pharmacology)', description: 'Doctor of Medicine in Pharmacology' },
  { name: 'MD (Community Medicine)', description: 'Doctor of Medicine in Community Medicine' },
  { name: 'MD (Forensic Medicine)', description: 'Doctor of Medicine in Forensic Medicine' },
  { name: 'MD (Respiratory Medicine)', description: 'Doctor of Medicine in Respiratory Medicine' },

  // Postgraduate Degrees (MS)
  { name: 'MS (General Surgery)', description: 'Master of Surgery in General Surgery' },
  { name: 'MS (Orthopedics)', description: 'Master of Surgery in Orthopedics' },
  { name: 'MS (ENT)', description: 'Master of Surgery in Ear, Nose, Throat' },
  { name: 'MS (Ophthalmology)', description: 'Master of Surgery in Ophthalmology' },
  { name: 'MS (Obstetrics & Gynecology)', description: 'Master of Surgery in Obstetrics & Gynecology' },

  // DNB (Diplomate of National Board)
  { name: 'DNB (General Medicine)', description: 'Diplomate of National Board in General Medicine' },
  { name: 'DNB (General Surgery)', description: 'Diplomate of National Board in General Surgery' },
  { name: 'DNB (Pediatrics)', description: 'Diplomate of National Board in Pediatrics' },
  { name: 'DNB (Orthopedics)', description: 'Diplomate of National Board in Orthopedics' },
  { name: 'DNB (Anesthesia)', description: 'Diplomate of National Board in Anesthesia' },
  { name: 'DNB (Obstetrics & Gynecology)', description: 'Diplomate of National Board in Obstetrics & Gynecology' },

  // Diploma Courses
  { name: 'Diploma in Child Health (DCH)', description: 'Diploma in Child Health' },
  { name: 'Diploma in Orthopedics (D.Ortho)', description: 'Diploma in Orthopedics' },
  { name: 'Diploma in Obstetrics & Gynecology (DGO)', description: 'Diploma in Obstetrics & Gynecology' },
  { name: 'Diploma in Anesthesia (DA)', description: 'Diploma in Anesthesia' },
  { name: 'Diploma in Ophthalmology (DO)', description: 'Diploma in Ophthalmology' },
  { name: 'Diploma in Otorhinolaryngology (DLO)', description: 'Diploma in ENT' },
  { name: 'Diploma in Dermatology (DDV)', description: 'Diploma in Dermatology & Venereology' },
  { name: 'Diploma in Public Health (DPH)', description: 'Diploma in Public Health' },

  // Super Speciality (DM)
  { name: 'DM (Cardiology)', description: 'Doctorate of Medicine in Cardiology' },
  { name: 'DM (Neurology)', description: 'Doctorate of Medicine in Neurology' },
  { name: 'DM (Gastroenterology)', description: 'Doctorate of Medicine in Gastroenterology' },
  { name: 'DM (Nephrology)', description: 'Doctorate of Medicine in Nephrology' },
  { name: 'DM (Endocrinology)', description: 'Doctorate of Medicine in Endocrinology' },
  { name: 'DM (Oncology)', description: 'Doctorate of Medicine in Oncology' },
  { name: 'DM (Rheumatology)', description: 'Doctorate of Medicine in Rheumatology' },

  // Super Speciality (MCh)
  { name: 'MCh (Cardiothoracic Surgery)', description: 'Master of Chirurgiae in Cardiothoracic Surgery' },
  { name: 'MCh (Neurosurgery)', description: 'Master of Chirurgiae in Neurosurgery' },
  { name: 'MCh (Plastic Surgery)', description: 'Master of Chirurgiae in Plastic Surgery' },
  { name: 'MCh (Urology)', description: 'Master of Chirurgiae in Urology' },
  { name: 'MCh (Pediatric Surgery)', description: 'Master of Chirurgiae in Pediatric Surgery' },

  // Dental Specializations
  { name: 'MDS (Oral Surgery)', description: 'Master of Dental Surgery in Oral Surgery' },
  { name: 'MDS (Orthodontics)', description: 'Master of Dental Surgery in Orthodontics' },
  { name: 'MDS (Periodontics)', description: 'Master of Dental Surgery in Periodontics' },
  { name: 'MDS (Prosthodontics)', description: 'Master of Dental Surgery in Prosthodontics' },

  // Other Postgraduate
  { name: 'M.Pharm', description: 'Master of Pharmacy' },
  { name: 'M.Sc Nursing', description: 'Master of Science in Nursing' },
  { name: 'MPH', description: 'Master of Public Health' },
  { name: 'MHA', description: 'Master of Hospital Administration' },
];

// Comprehensive list of medical specialities
const specialities = [
  // Primary Care
  { name: 'General Physician', description: 'General Medicine and Primary Care' },
  { name: 'General Practitioner', description: 'Family Medicine and General Practice' },
  { name: 'Internal Medicine', description: 'Internal Medicine Specialist' },

  // Surgical Specialities
  { name: 'General Surgery', description: 'General Surgical Procedures' },
  { name: 'Cardiothoracic Surgery', description: 'Heart and Chest Surgery' },
  { name: 'Neurosurgery', description: 'Brain and Nervous System Surgery' },
  { name: 'Orthopedic Surgery', description: 'Bone and Joint Surgery' },
  { name: 'Plastic Surgery', description: 'Reconstructive and Cosmetic Surgery' },
  { name: 'Pediatric Surgery', description: 'Surgery for Children' },
  { name: 'Urology', description: 'Urinary System and Male Reproductive Surgery' },
  { name: 'Vascular Surgery', description: 'Blood Vessel Surgery' },
  { name: 'Transplant Surgery', description: 'Organ Transplantation' },

  // Medical Specialities
  { name: 'Cardiology', description: 'Heart and Cardiovascular System' },
  { name: 'Neurology', description: 'Brain and Nervous System' },
  { name: 'Gastroenterology', description: 'Digestive System' },
  { name: 'Nephrology', description: 'Kidney Diseases' },
  { name: 'Endocrinology', description: 'Hormones and Metabolism' },
  { name: 'Pulmonology', description: 'Respiratory System and Lungs' },
  { name: 'Rheumatology', description: 'Autoimmune and Joint Diseases' },
  { name: 'Hematology', description: 'Blood Disorders' },
  { name: 'Oncology', description: 'Cancer Treatment' },
  { name: 'Infectious Diseases', description: 'Infectious Disease Specialist' },

  // Pediatrics
  { name: 'Pediatrics', description: 'Child Healthcare' },
  { name: 'Neonatology', description: 'Newborn Care' },
  { name: 'Pediatric Cardiology', description: 'Child Heart Specialist' },
  { name: 'Pediatric Neurology', description: 'Child Neurologist' },

  // Women & Child Health
  { name: 'Obstetrics & Gynecology', description: 'Pregnancy and Women\'s Health' },
  { name: 'Reproductive Medicine', description: 'Fertility and IVF Specialist' },
  { name: 'Maternal Fetal Medicine', description: 'High-Risk Pregnancy' },

  // Diagnostic Specialities
  { name: 'Radiology', description: 'Medical Imaging' },
  { name: 'Pathology', description: 'Laboratory Medicine and Diagnostics' },
  { name: 'Nuclear Medicine', description: 'Radioactive Diagnostics' },

  // Support Specialities
  { name: 'Anesthesiology', description: 'Anesthesia and Pain Management' },
  { name: 'Critical Care', description: 'Intensive Care Medicine' },
  { name: 'Emergency Medicine', description: 'Emergency and Trauma Care' },
  { name: 'Pain Medicine', description: 'Chronic Pain Management' },
  { name: 'Palliative Care', description: 'End-of-Life Care' },

  // Sensory Specialities
  { name: 'Ophthalmology', description: 'Eye Care and Surgery' },
  { name: 'ENT (Otolaryngology)', description: 'Ear, Nose, and Throat' },
  { name: 'Audiology', description: 'Hearing Disorders' },

  // Skin & Aesthetics
  { name: 'Dermatology', description: 'Skin, Hair, and Nail Disorders' },
  { name: 'Cosmetology', description: 'Cosmetic Procedures' },
  { name: 'Aesthetic Medicine', description: 'Aesthetic and Anti-Aging' },

  // Mental Health
  { name: 'Psychiatry', description: 'Mental Health and Behavioral Disorders' },
  { name: 'Clinical Psychology', description: 'Psychological Therapy' },
  { name: 'Addiction Medicine', description: 'Substance Abuse Treatment' },

  // Allied Specialities
  { name: 'Physical Medicine & Rehabilitation', description: 'Physiotherapy and Rehabilitation' },
  { name: 'Sports Medicine', description: 'Sports Injuries and Performance' },
  { name: 'Geriatrics', description: 'Elderly Care' },
  { name: 'Community Medicine', description: 'Public Health and Preventive Medicine' },
  { name: 'Occupational Medicine', description: 'Workplace Health' },

  // Dental Specialities
  { name: 'Oral & Maxillofacial Surgery', description: 'Dental and Jaw Surgery' },
  { name: 'Orthodontics', description: 'Teeth Alignment and Braces' },
  { name: 'Periodontics', description: 'Gum Diseases' },
  { name: 'Prosthodontics', description: 'Dental Prosthetics' },
  { name: 'Endodontics', description: 'Root Canal Treatment' },
  { name: 'Pedodontics', description: 'Pediatric Dentistry' },

  // Alternative Medicine
  { name: 'Ayurveda', description: 'Traditional Indian Medicine' },
  { name: 'Homeopathy', description: 'Homeopathic Medicine' },
  { name: 'Unani Medicine', description: 'Traditional Unani Medicine' },
  { name: 'Naturopathy', description: 'Natural Healing' },

  // Other Specialities
  { name: 'Sexology', description: 'Sexual Health' },
  { name: 'Diabetology', description: 'Diabetes Management' },
  { name: 'Bariatric Surgery', description: 'Weight Loss Surgery' },
  { name: 'Interventional Radiology', description: 'Minimally Invasive Procedures' },
  { name: 'Clinical Nutrition', description: 'Dietetics and Nutrition' },
  { name: 'Medical Genetics', description: 'Genetic Disorders' },
  { name: 'Sleep Medicine', description: 'Sleep Disorders' },
];

async function main() {
  console.log('Seeding qualifications and specialities...');

  // Seed qualifications
  for (const qual of qualifications) {
    await prisma.doctorQualification.upsert({
      where: { name: qual.name },
      update: { description: qual.description },
      create: qual,
    });
  }
  console.log(`✓ Seeded ${qualifications.length} qualifications`);

  // Seed specialities
  for (const spec of specialities) {
    await prisma.doctorSpeciality.upsert({
      where: { name: spec.name },
      update: { description: spec.description },
      create: spec,
    });
  }
  console.log(`✓ Seeded ${specialities.length} specialities`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
