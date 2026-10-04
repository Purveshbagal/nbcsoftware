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
    callObjective: { type: String, trim: true },
    postCallInfo: { type: String, trim: true },
    remarks: { type: String, trim: true },
    products: { type: [String], default: [] },
    samples: { type: [String], default: [] },
    gifts: { type: [String], default: [] },
    pobValue: { type: Number },
    skippedReason: { type: String, trim: true },

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
