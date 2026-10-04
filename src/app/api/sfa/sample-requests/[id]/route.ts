import { itemRoutes } from "@/lib/sfa-crud";
import { sampleRequestCrud } from "@/lib/sfa-entities";
import SampleRequestModel from "@/models/SampleRequest";

export const { PATCH, DELETE } = itemRoutes(() => SampleRequestModel, sampleRequestCrud);
