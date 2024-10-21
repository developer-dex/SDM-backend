import { UPLOAD_PATH } from "../../helpers/constants";
import getEnvVar, {
    formateFrontImagePath,
    getFileName,
    removeFile,
} from "../../helpers/util";
import FrontImage from "../../models/FrontImage";

export class WebsiteFrontImageService {
    constructor() {}

    updateWebsiteFrontImage = async (
        requestData: Record<string, any>,
        file: Express.Multer.File
    ): Promise<void> => {
        const isExistImagePath = await FrontImage.findOne({
            category: requestData.category,
        });

        if (isExistImagePath) {
            removeFile(isExistImagePath.imagePath);
            await FrontImage.deleteOne({ category: requestData.category });
        }

        await FrontImage.create({
            imagePath: file.path,
            category: requestData.category,
        });
    };

    getWebsiteFrontImageUrlByCategory = async (
        category: any
    ) => {
        const frontImage = await FrontImage.findOne({ category });

        if (frontImage) {
            // Construct the full URL using the base URL from config and the image path
            const relativePath = formateFrontImagePath(frontImage.imagePath);


            return {
                image_url: `${getEnvVar("LOCAL_URL")}/assets${relativePath}`
            };
        }
        return null;
    };

    getAllWebsiteFrontImages = async () => {
        const frontImages = await FrontImage.find();
        const frontImagesWithFullUrl = frontImages.map((frontImage) => {
            const relativePath = formateFrontImagePath(frontImage.imagePath);
            const fullImagePath = `${getEnvVar("LOCAL_URL")}/assets${relativePath}`;

            return {
                ...frontImage.toObject(),
                imagePath: fullImagePath,
            };
        });
        return frontImagesWithFullUrl;
    };
}
