import { collectionRoutes } from "@/lib/sfa-crud";
import { sampleRequestCrud } from "@/lib/sfa-entities";
import SampleRequestModel from "@/models/SampleRequest";

export const { GET, POST } = collectionRoutes(() => SampleRequestModel, sampleRequestCrud);
