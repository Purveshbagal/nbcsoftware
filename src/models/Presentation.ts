import mongoose, { Schema, type InferSchemaType } from "mongoose";

const presentationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // File details
    fileUrl: { type: String, trim: true }, // URL or path to presentation file
    fileType: { type: String, enum: ["pdf", "ppt", "pptx", "image", "video"], default: "pdf" },
    fileName: { type: String, trim: true },
    fileSize: { type: Number }, // in bytes

    // Categorization
    category: { type: String, trim: true }, // e.g., "Product Launch", "Training", etc.
    products: { type: [String], default: [] }, // Associated product names
    division: { type: String, trim: true },

    // Visibility
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date },

    // Tracking
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },

    createdBy: { username: String, name: String },
    updatedBy: { username: String, name: String },
  },
  { timestamps: true }
);

presentationSchema.index({ title: 1 });
presentationSchema.index({ isActive: 1, publishedAt: -1 });

export type Presentation = InferSchemaType<typeof presentationSchema>;

export default mongoose.models.Presentation ||
  mongoose.model("Presentation", presentationSchema);
