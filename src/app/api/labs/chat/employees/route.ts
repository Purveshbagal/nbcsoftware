import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireEmployee } from "@/lib/labs-auth";
import EmployeeModel from "@/models/Employee";

// GET /api/labs/chat/employees - Get all employees for chat list
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    await connectToDatabase();

    // Get all active employees except the current user
    const employees = await EmployeeModel.find({
      isActive: true,
      _id: { $ne: auth.employee._id },
    })
      .select("_id name profilePicture designation")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      employees,
    });
  } catch (error: any) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
