import mongoose, { Schema, type InferSchemaType } from "mongoose";

const presentationSchema = new Schema(
  {
    // Basic Info (matching screenshot)
    title: { type: String, required: true, trim: true }, // Presentation Name
    description: { type: String, trim: true },
    division: { type: String, trim: true },
    date: { type: Date, default: Date.now },

    // Assignment (matching screenshot)
    assigningType: { type: String, enum: ["Employee", "Doctor"], default: "Employee" }, // Assigned Type
    assignedTo: { type: String, trim: true }, // Assigned To (employee/doctor name)
    assignedToId: { type: String, trim: true }, // ID of assigned person

    // Slides/Gallery
    slides: [
      {
        imageUrl: { type: String }, // URL or path to slide image
        imageData: { type: String }, // Base64 encoded image data
        order: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Cover Image (shown in card)
    coverImage: { type: String }, // URL or base64 of cover image

    // Legacy fields for compatibility
    fileUrl: { type: String, trim: true },
    fileType: { type: String, trim: true },
    fileName: { type: String, trim: true },
    fileSize: { type: Number },
    category: { type: String, trim: true },
    products: { type: [String], default: [] },

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
