export type ProductRecord = {
  _id: string;
  name: string;
  composition: string;
  category: "syrup" | "tablet" | "speciality";
  pack?: string;
  specialClaim?: string;
};
