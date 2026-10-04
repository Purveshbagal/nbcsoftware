import { collectionRoutes } from "@/lib/sfa-crud";
import { mediaAssetCrud } from "@/lib/sfa-entities";
import MediaAssetModel from "@/models/MediaAsset";

export const { GET, POST } = collectionRoutes(() => MediaAssetModel, mediaAssetCrud);
