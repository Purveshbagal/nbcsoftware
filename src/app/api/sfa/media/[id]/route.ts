import { itemRoutes } from "@/lib/sfa-crud";
import { mediaAssetCrud } from "@/lib/sfa-entities";
import MediaAssetModel from "@/models/MediaAsset";

export const { PATCH, DELETE } = itemRoutes(() => MediaAssetModel, mediaAssetCrud);
