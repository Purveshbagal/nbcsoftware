import mongoose, { Schema, type InferSchemaType } from "mongoose";

const employeeSchema = new Schema(
  {
    code: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    contactNo: { type: String, trim: true },
    workType: { type: String, trim: true },
    assignTo: { type: String, trim: true },

    city: { type: String, trim: true },
    state: { type: String, trim: true },
    address: { type: String, trim: true },
    division: { type: String, trim: true },
    zone: { type: String, trim: true },
    designation: { type: String, trim: true },
    /** Name of the immediate senior — the "See Hierarchy" view walks this field. */
    reportingTo: { type: String, trim: true },

    dateOfBirth: { type: String, trim: true },
    dateOfJoin: { type: String, trim: true },
    dateOfResignation: { type: String, trim: true },
    inactiveDate: { type: String, trim: true },
    inactiveReason: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    createdBy: { username: String, name: String },

    // NBC Labs mobile app sign-in. Kept apart from the User model on purpose:
    // NBC Pedia accounts cannot sign in to this app, and the other way round.
    appUsername: { type: String, trim: true, lowercase: true },
    /** Never returned by a query unless asked for with `+appPasswordHash`. */
    appPasswordHash: { type: String, select: false },
    appAccessEnabled: { type: Boolean, default: false },

    /** Last position the app reported, so the live map needs no aggregation. */
    lastLocation: {
      lat: Number,
      lng: Number,
      accuracy: Number,
      battery: Number,
      at: Date,
    },
    lastSeenAt: { type: Date },
    deviceInfo: { type: String, trim: true },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 1 });
employeeSchema.index(
  { appUsername: 1 },
  { unique: true, partialFilterExpression: { appUsername: { $type: "string" } } }
);

export type Employee = InferSchemaType<typeof employeeSchema>;

export default mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
