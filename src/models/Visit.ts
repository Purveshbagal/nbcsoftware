import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Doctor visits and firm visits are the same record with a different subject,
 * so the two list screens are one collection filtered by `visitType`.
 */
const visitSchema = new Schema(
  {
    visitCode: { type: String, trim: true },
    visitType: { type: String, enum: ["doctor", "firm"], required: true },

    doctor: { type: String, trim: true },
    firm: { type: String, trim: true },
    clinicAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    zone: { type: String, trim: true },
    division: { type: String, trim: true },
    employeeName: { type: String, trim: true },

    visitDate: { type: String, trim: true },
    plannedDate: { type: String, trim: true }, // Date when visit is planned
    modeOfTransport: { type: String, enum: ["Bike", "Car", "Public Transport", ""], default: "" },
    callObjective: { type: String, trim: true },
    postCallInfo: { type: String, trim: true },
    remarks: { type: String, trim: true },
    extraInfo: { type: String, trim: true },

    // Products promoted during visit
    productsPromoted: [
      {
        productId: { type: String },
        productName: { type: String },
        isPrescribing: { type: Boolean, default: false },
        isTop5: { type: Boolean, default: false },
      },
    ],

    // Samples given during visit
    samplesGiven: [
      {
        productId: { type: String },
        productName: { type: String },
        quantity: { type: Number, default: 0 },
      },
    ],

    products: { type: [String], default: [] }, // Legacy field
    samples: { type: [String], default: [] }, // Legacy field
    gifts: { type: [String], default: [] },
    pobValue: { type: Number },
    skippedReason: { type: String, trim: true },
    metDoctor: { type: Boolean }, // Did the user meet the doctor?
    notMetReason: { type: String, trim: true }, // Reason if didn't meet

    // Visit photos
    photos: { type: [String], default: [] }, // Base64 or URLs

    // Presentation shown
    presentationShown: { type: Boolean, default: false },
    presentationId: { type: String, trim: true },

    // Set when the visit is logged from the NBC Labs mobile app.
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
    geo: { lat: Number, lng: Number, accuracy: Number },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    source: { type: String, enum: ["web", "app"], default: "web" },

    status: {
      type: String,
      enum: ["planned", "closed", "skipped", "open"],
      default: "planned",
    },
    createdBy: { username: String, name: String },
  },
  { timestamps: true }
);

visitSchema.index({ visitType: 1, visitDate: -1 });

export type Visit = InferSchemaType<typeof visitSchema>;

export default mongoose.models.Visit || mongoose.model("Visit", visitSchema);
