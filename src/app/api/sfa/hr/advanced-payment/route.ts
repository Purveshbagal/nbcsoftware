import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/sfa-crud";
import { readJsonBody } from "@/lib/read-json";
import AdvancedPaymentModel from "@/models/AdvancedPayment";
import EmployeeModel from "@/models/Employee";

// GET - List all advances
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  await connectToDatabase();

  const advances = await AdvancedPaymentModel.find({})
    .sort({ givenDate: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ items: advances });
}

// POST - Give new advance
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { employeeId, advanceAmount, paymentType, installmentAmount, installmentFromMonth, deductFromMonth, givenDate } = body;

  if (!employeeId || !advanceAmount || !paymentType) {
    return NextResponse.json(
      { error: "Employee ID, advance amount, and payment type are required" },
      { status: 400 }
    );
  }

  if (advanceAmount <= 0) {
    return NextResponse.json({ error: "Advance amount must be positive" }, { status: 400 });
  }

  await connectToDatabase();

  // Check for existing active advance
  const existing = await AdvancedPaymentModel.findOne({
    employeeId,
    status: "active"
  });

  if (existing) {
    return NextResponse.json(
      { error: "Employee already has an active advance" },
      { status: 409 }
    );
  }

  // Get employee details
  const employee = await EmployeeModel.findById(employeeId).select("code name");
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const advanceData: any = {
    employeeId,
    employeeCode: employee.code,
    employeeName: employee.name,
    advanceAmount: Number(advanceAmount),
    paymentType,
    totalDeducted: 0,
    remainingAmount: Number(advanceAmount),
    status: "active",
    givenDate: givenDate || new Date().toISOString().slice(0, 10),
    givenBy: { username: auth.session!.username, name: auth.session!.name },
  };

  if (paymentType === "one_time") {
    if (!deductFromMonth) {
      return NextResponse.json(
        { error: "Deduct from month is required for one-time payment" },
        { status: 400 }
      );
    }
    advanceData.deductFromMonth = deductFromMonth;
  } else if (paymentType === "installment") {
    if (!installmentAmount || !installmentFromMonth) {
      return NextResponse.json(
        { error: "Installment amount and start month are required" },
        { status: 400 }
      );
    }

    const instAmount = Number(installmentAmount);
    if (instAmount <= 0 || instAmount > advanceAmount) {
      return NextResponse.json(
        { error: "Invalid installment amount" },
        { status: 400 }
      );
    }

    advanceData.installmentAmount = instAmount;
    advanceData.installmentFromMonth = installmentFromMonth;

    // Generate installments
    const installments = [];
    let remaining = advanceAmount;
    const [startYear, startMonth] = installmentFromMonth.split("-").map(Number);
    let currentDate = new Date(startYear, startMonth - 1, 1);

    while (remaining > 0) {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const amount = Math.min(instAmount, remaining);

      installments.push({
        month,
        amount,
        status: "pending",
      });

      remaining -= amount;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    advanceData.installments = installments;
  }

  const advance = await AdvancedPaymentModel.create(advanceData);

  return NextResponse.json({ item: advance }, { status: 201 });
}
