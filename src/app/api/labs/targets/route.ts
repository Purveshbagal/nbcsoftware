import { NextResponse } from "next/server";

import { istDateKey, requireEmployee } from "@/lib/labs-auth";
import OrderModel from "@/models/Order";
import TargetModel from "@/models/Target";
import VisitModel from "@/models/Visit";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * This month's employee target next to what has been achieved so far: doctor
 * and chemist calls from visits, POB from visits plus order values.
 */
export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const today = istDateKey();
  const year = today.slice(0, 4);
  const monthIndex = Number(today.slice(5, 7)) - 1;
  const monthStart = `${today.slice(0, 8)}01`;
  const monthName = MONTHS[monthIndex];

  // The Target screen stores the month however it was typed or picked.
  const monthValues = [
    monthName,
    monthName[0].toUpperCase() + monthName.slice(1),
    String(monthIndex + 1),
    String(monthIndex + 1).padStart(2, "0"),
  ];

  const owner = { employeeName: employee.name };
  const [target, doctorVisits, chemistVisits, pob, orders] = await Promise.all([
    TargetModel.findOne({
      targetType: "employee",
      employeeName: employee.name,
      year,
      month: { $in: monthValues },
    }).lean(),
    VisitModel.countDocuments({ ...owner, visitType: "doctor", status: "closed", visitDate: { $gte: monthStart } }),
    VisitModel.countDocuments({ ...owner, visitType: "firm", status: "closed", visitDate: { $gte: monthStart } }),
    VisitModel.aggregate<{ total: number }>([
      { $match: { ...owner, visitDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$pobValue", 0] } } } },
    ]),
    OrderModel.aggregate<{ total: number }>([
      { $match: { ...owner, orderDate: { $gte: monthStart }, status: { $ne: "cancelled" } } },
      { $unwind: "$lines" },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $multiply: [
                "$lines.quantity",
                "$lines.rate",
                { $subtract: [1, { $divide: [{ $ifNull: ["$lines.discount", 0] }, 100] }] },
              ],
            },
          },
        },
      },
    ]),
  ]);

  return NextResponse.json({
    month: today.slice(0, 7),
    target,
    achieved: {
      doctorVisits,
      chemistVisits,
      pobValue: Math.round((pob[0]?.total ?? 0) + (orders[0]?.total ?? 0)),
    },
  });
}
