import { executeSqlQuery, retrieveData } from "../../config/databaseConfig";
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
        const query = `SELECT * FROM FrontImages WHERE category = '${requestData.category}'`;   
        const isExistImagePath = await retrieveData(query);

        if (isExistImagePath[0]) {
            removeFile(isExistImagePath[0].imagePath);
            const deleteQuery = `DELETE FROM FrontImages WHERE category = '${requestData.category}'`;
            await executeSqlQuery(deleteQuery);
        }

        await FrontImage.create({
            imagePath: file.path,
            category: requestData.category,
        });
    };

    getWebsiteFrontImageUrlByCategory = async (
        category: any
    ) => {
        const query = `SELECT * FROM FrontImages WHERE category = '${category}'`;
        const frontImage = await retrieveData(query);

        if (frontImage[0]) {
            // Construct the full URL using the base URL from config and the image path
            const relativePath = formateFrontImagePath(frontImage[0].imagePath);


            return {
                image_url: `${getEnvVar("LOCAL_URL")}/assets${relativePath}`
            };
        }
        return null;
    };

    getAllWebsiteFrontImages = async () => {
        const query = `SELECT * FROM FrontImage`;
        const frontImages = await retrieveData(query);
        const frontImagesWithFullUrl = frontImages.rows.map((frontImage) => {
            const relativePath = formateFrontImagePath(frontImage.imagePath);
            const fullImagePath = `${getEnvVar("LOCAL_URL")}/assets${relativePath}`;

            return {
                ...frontImage,
                imagePath: fullImagePath,
            };
        });
        return frontImagesWithFullUrl;
    };
}
