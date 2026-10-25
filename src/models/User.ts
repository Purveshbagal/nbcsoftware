import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, default: "Administrator" },
    role: { type: String, enum: ["admin", "field"], default: "admin" },
    isActive: { type: Boolean, default: true },

    // Budget limits for field users
    budgetLimit: {
      totalLimit: { type: Number, default: 0 }, // Total budget limit assigned by admin
      spentAmount: { type: Number, default: 0 }, // Amount already spent/approved
      availableAmount: { type: Number, default: 0 }, // Remaining budget (calculated: totalLimit - spentAmount)
    },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

export default mongoose.models.User || mongoose.model("User", userSchema);
