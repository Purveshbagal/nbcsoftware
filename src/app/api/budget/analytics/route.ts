import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import PaymentModel from "@/models/Payment";

/**
 * GET budget analytics for admin dashboard
 * Shows user-wise spending with graph data
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "this_month"; // last_month, this_month, this_year, custom
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  await connectToDatabase();

  // Calculate date range based on period
  const now = new Date();
  let dateFilter: any = {};

  if (period === "last_month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    dateFilter = {
      createdAt: {
        $gte: lastMonth,
        $lte: lastMonthEnd,
      },
    };
  } else if (period === "this_month") {
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = {
      createdAt: {
        $gte: thisMonthStart,
      },
    };
  } else if (period === "this_year") {
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    dateFilter = {
      createdAt: {
        $gte: thisYearStart,
      },
    };
  } else if (period === "custom" && startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }

  // Get all users with budget limits
  const users = await UserModel.find({ role: "field" })
    .select("username name budgetLimit")
    .lean();

  // Get payments for the period grouped by user
  const payments = await PaymentModel.find({
    ...dateFilter,
    status: { $in: ["approved", "pending"] },
  })
    .select("requestedBy amount status createdAt")
    .lean();

  // Aggregate data by user
  const userAnalytics = users.map((user) => {
    const userPayments = payments.filter(
      (p: any) => p.requestedBy?.username === user.username
    );

    const totalSpent = userPayments
      .filter((p: any) => p.status === "approved")
      .reduce((sum, p: any) => sum + (p.amount || 0), 0);

    const pendingAmount = userPayments
      .filter((p: any) => p.status === "pending")
      .reduce((sum, p: any) => sum + (p.amount || 0), 0);

    return {
      username: user.username,
      name: user.name,
      totalLimit: user.budgetLimit?.totalLimit || 0,
      spentAmount: user.budgetLimit?.spentAmount || 0,
      availableAmount: user.budgetLimit?.availableAmount || 0,
      periodSpent: totalSpent,
      periodPending: pendingAmount,
      utilizationPercent:
        user.budgetLimit?.totalLimit > 0
          ? ((user.budgetLimit?.spentAmount || 0) / user.budgetLimit.totalLimit) * 100
          : 0,
    };
  });

  // Sort by spent amount (highest first)
  userAnalytics.sort((a, b) => b.periodSpent - a.periodSpent);

  // Calculate totals
  const totals = {
    totalBudgetAllocated: userAnalytics.reduce((sum, u) => sum + u.totalLimit, 0),
    totalSpent: userAnalytics.reduce((sum, u) => sum + u.spentAmount, 0),
    totalAvailable: userAnalytics.reduce((sum, u) => sum + u.availableAmount, 0),
    periodSpent: userAnalytics.reduce((sum, u) => sum + u.periodSpent, 0),
    periodPending: userAnalytics.reduce((sum, u) => sum + u.periodPending, 0),
  };

  return NextResponse.json({
    period,
    startDate: dateFilter.createdAt?.$gte || null,
    endDate: dateFilter.createdAt?.$lte || null,
    totals,
    users: userAnalytics,
  });
}
