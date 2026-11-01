import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, default: "Administrator" },
    mobileNumber: { type: String, trim: true },
    role: { type: String, enum: ["admin", "field"], default: "admin" },
    isActive: { type: Boolean, default: true },

    // Budget limits for field users
    budgetLimit: {
      totalLimit: { type: Number, default: 0 }, // Total budget limit assigned by admin
      spentAmount: { type: Number, default: 0 }, // Amount already spent/approved
      availableAmount: { type: Number, default: 0 }, // Remaining budget (calculated: totalLimit - spentAmount)
      updatedAt: { type: Date }, // When the budget was last updated
      updatedBy: { type: String }, // Who updated the budget
    },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

export default mongoose.models.User || mongoose.model("User", userSchema);
