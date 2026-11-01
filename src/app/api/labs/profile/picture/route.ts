import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { connectToDatabase } from "@/lib/mongodb";
import { requireEmployee } from "@/lib/labs-auth";
import EmployeeModel from "@/models/Employee";

// POST /api/labs/profile/picture - Upload profile picture
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB for profile pictures)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum 2MB allowed" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const employeeId = auth.employee._id.toString();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `profile_${employeeId}_${timestamp}.${extension}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Update employee profile picture
    const imageUrl = `/uploads/profiles/${filename}`;
    await EmployeeModel.findByIdAndUpdate(auth.employee._id, {
      profilePicture: imageUrl,
    });

    return NextResponse.json({
      message: "Profile picture updated successfully",
      profilePicture: imageUrl,
    });
  } catch (error: any) {
    console.error("Failed to upload profile picture:", error);
    return NextResponse.json({ error: error.message || "Failed to upload profile picture" }, { status: 500 });
  }
}

// DELETE /api/labs/profile/picture - Remove profile picture
export async function DELETE(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    await EmployeeModel.findByIdAndUpdate(auth.employee._id, {
      profilePicture: "",
    });

    return NextResponse.json({
      message: "Profile picture removed successfully",
    });
  } catch (error: any) {
    console.error("Failed to remove profile picture:", error);
    return NextResponse.json({ error: error.message || "Failed to remove profile picture" }, { status: 500 });
  }
}
