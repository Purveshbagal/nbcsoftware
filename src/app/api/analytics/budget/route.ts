import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentModel from "@/models/Payment";
import UserModel from "@/models/User";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "this_month"; // last_month, this_month, this_year, custom
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const username = searchParams.get("username");

  await connectToDatabase();

  // Calculate date range based on period
  let dateFilter: any = {};
  const now = new Date();

  if (period === "this_month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    dateFilter = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (period === "last_month") {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    dateFilter = { $gte: startOfLastMonth, $lte: endOfLastMonth };
  } else if (period === "this_year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    dateFilter = { $gte: startOfYear, $lte: endOfYear };
  } else if (period === "custom" && startDate && endDate) {
    dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // For admin: get all users' spending
  // For field user: get only their own data
  if (session.role === "admin") {
    // Get all field users
    const users = await UserModel.find({ role: "field" }).select(
      "username name budgetLimit"
    );

    // Filter by username if provided
    const filteredUsers = username
      ? users.filter((u) => u.username === username)
      : users;

    // Get spending data for each user
    const userSpending = await Promise.all(
      filteredUsers.map(async (user) => {
        const query: any = {
          "requestedBy.username": user.username,
          status: "approved",
        };

        if (Object.keys(dateFilter).length > 0) {
          query.reviewedAt = dateFilter;
        }

        const payments = await PaymentModel.find(query);
        const spending = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
          username: user.username,
          name: user.name,
          totalLimit: user.budgetLimit?.totalLimit || 0,
          spentAmount: user.budgetLimit?.spentAmount || 0,
          availableAmount: user.budgetLimit?.availableAmount || 0,
          periodSpending: spending,
          payments: payments.map((p) => ({
            id: p._id.toString(),
            doctorName: p.doctorName,
            productName: p.productName,
            amount: p.amount,
            purpose: p.purpose,
            reviewedAt: p.reviewedAt,
          })),
        };
      })
    );

    return NextResponse.json({
      period,
      startDate: startDate || dateFilter.$gte?.toISOString(),
      endDate: endDate || dateFilter.$lte?.toISOString(),
      users: userSpending,
    });
  } else {
    // Field user - only their own data
    const user = await UserModel.findOne({ username: session.username });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const query: any = {
      "requestedBy.username": session.username,
      status: "approved",
    };

    if (Object.keys(dateFilter).length > 0) {
      query.reviewedAt = dateFilter;
    }

    const payments = await PaymentModel.find(query);
    const spending = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      period,
      startDate: startDate || dateFilter.$gte?.toISOString(),
      endDate: endDate || dateFilter.$lte?.toISOString(),
      username: user.username,
      name: user.name,
      totalLimit: user.budgetLimit?.totalLimit || 0,
      spentAmount: user.budgetLimit?.spentAmount || 0,
      availableAmount: user.budgetLimit?.availableAmount || 0,
      periodSpending: spending,
      payments: payments.map((p) => ({
        id: p._id.toString(),
        doctorName: p.doctorName,
        productName: p.productName,
        amount: p.amount,
        purpose: p.purpose,
        reviewedAt: p.reviewedAt,
      })),
    });
  }
}
