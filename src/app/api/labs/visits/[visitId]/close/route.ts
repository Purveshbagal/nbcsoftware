import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import VisitModel from "@/models/Visit";

type ProductPromoted = {
  productId: string;
  productName: string;
  isPrescribing: boolean;
  isTop5: boolean;
};

type SampleGiven = {
  productId: string;
  productName: string;
  quantity: number;
};

/**
 * Close a visit
 * Step 1: Did you meet the doctor?
 * - If NO: Provide reason and close
 * - If YES: Provide products promoted and samples given
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ visitId: string }> }
) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;
  const { employee } = auth;

  const { visitId } = await params;

  const body = (await readJsonBody(request)) as
    | {
        metDoctor: boolean;
        notMetReason?: string;
        productsPromoted?: ProductPromoted[];
        samplesGiven?: SampleGiven[];
      }
    | null;

  if (!body || body.metDoctor === undefined) {
    return NextResponse.json(
      { error: "metDoctor field is required" },
      { status: 400 }
    );
  }

  const visit = await VisitModel.findOne({ _id: visitId, employeeName: employee.name });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  if (visit.status !== "open") {
    return NextResponse.json(
      { error: "Visit is not in open status" },
      { status: 400 }
    );
  }

  const now = new Date();

  visit.metDoctor = body.metDoctor;
  visit.checkOutAt = now;

  if (!body.metDoctor) {
    // Doctor not met - mark as skipped
    if (!body.notMetReason?.trim()) {
      return NextResponse.json(
        { error: "Please provide reason for not meeting the doctor" },
        { status: 400 }
      );
    }
    visit.status = "skipped";
    visit.notMetReason = body.notMetReason;
  } else {
    // Doctor met - save products and samples
    visit.status = "closed";

    if (body.productsPromoted && Array.isArray(body.productsPromoted)) {
      visit.productsPromoted = body.productsPromoted.map((p) => ({
        productId: String(p.productId || ""),
        productName: String(p.productName || ""),
        isPrescribing: Boolean(p.isPrescribing),
        isTop5: Boolean(p.isTop5),
      }));

      // Also populate legacy products field for compatibility
      visit.products = body.productsPromoted
        .filter((p) => p.isPrescribing)
        .map((p) => p.productName);
    }

    if (body.samplesGiven && Array.isArray(body.samplesGiven)) {
      visit.samplesGiven = body.samplesGiven
        .filter((s) => Number(s.quantity) > 0)
        .map((s) => ({
          productId: String(s.productId || ""),
          productName: String(s.productName || ""),
          quantity: Number(s.quantity) || 0,
        }));

      // Also populate legacy samples field for compatibility
      visit.samples = body.samplesGiven
        .filter((s) => Number(s.quantity) > 0)
        .map((s) => `${s.productName} (${s.quantity})`);
    }
  }

  await visit.save();

  return NextResponse.json({ visit });
}
