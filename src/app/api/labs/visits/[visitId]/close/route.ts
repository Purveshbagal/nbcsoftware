import { NextResponse } from "next/server";

import { requireEmployee } from "@/lib/labs-auth";
import { readJsonBody } from "@/lib/read-json";
import VisitModel from "@/models/Visit";
import SampleRequestModel from "@/models/SampleRequest";

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
        presentationsShown?: { presentationId: string; presentationTitle: string }[];
        callObjective?: string;
        remarks?: string;
        extraInfo?: string;
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

  // Samples are inventory allocated only after an administrator approves the
  // field employee's request. Never allow a visit to consume more than that.
  if (body.samplesGiven?.length) {
    const [approved, completed] = await Promise.all([
      SampleRequestModel.find({ employeeName: employee.name, itemType: "sample", status: "approved" }).lean(),
      VisitModel.find({ employeeName: employee.name, status: "closed", _id: { $ne: visit._id } }).select("samplesGiven").lean(),
    ]);
    const available = new Map<string, number>();
    for (const row of approved) available.set(row.item, (available.get(row.item) ?? 0) + row.quantity);
    for (const row of completed) for (const sample of row.samplesGiven ?? []) {
      available.set(sample.productName, (available.get(sample.productName) ?? 0) - sample.quantity);
    }
    for (const sample of body.samplesGiven) {
      const quantity = Number(sample.quantity) || 0;
      if (quantity > (available.get(sample.productName) ?? 0)) {
        return NextResponse.json({ error: `Insufficient approved sample stock for ${sample.productName}.` }, { status: 400 });
      }
      available.set(sample.productName, (available.get(sample.productName) ?? 0) - quantity);
    }
  }

  const now = new Date();

  visit.metDoctor = body.metDoctor;
  visit.checkOutAt = now;
  visit.callObjective = String(body.callObjective ?? "").trim();
  visit.remarks = String(body.remarks ?? "").trim();
  visit.extraInfo = String(body.extraInfo ?? "").trim();

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

    if (body.presentationsShown && Array.isArray(body.presentationsShown)) {
      visit.presentationsShown = body.presentationsShown.map((p) => ({
        presentationId: String(p.presentationId || ""),
        presentationTitle: String(p.presentationTitle || ""),
        shownAt: now,
      }));
      visit.presentationShown = visit.presentationsShown.length > 0;
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
