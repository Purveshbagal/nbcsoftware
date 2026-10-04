import { employeeCollectionRoutes, referenceNumber } from "@/lib/labs-crud";
import SampleRequestModel from "@/models/SampleRequest";

export const { GET, POST } = employeeCollectionRoutes(() => SampleRequestModel, {
  label: "Request",
  required: ["requestDate", "item", "quantity"],
  sort: { requestDate: -1 },
  defaults: { status: "pending" },
  fields: {
    requestDate: "string",
    itemType: "string",
    item: "string",
    quantity: "number",
    remarks: "string",
  },
  prepare(doc) {
    doc.requestNo = referenceNumber("SR");
    if (doc.itemType !== "gift") doc.itemType = "sample";
  },
});
