import {
    executeQuery,
    retrieveData,
} from "../../config/databaseConfig";
import { UPLOAD_PATH } from "../../helpers/constants";
import getEnvVar, {
    calculatePagination,
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
    ) => {
        const query = `SELECT * FROM FrontImage WHERE category = '${requestData.category}'`;
        const isExistImagePath = await executeQuery(query);

        if (isExistImagePath.rows[0]) {
            removeFile(isExistImagePath.rows[0].imagePath);
        }

       const updateNewFilePathQuery = `UPDATE FrontImage SET imagePath = '${file.path}' WHERE category = '${requestData.category}'`;
       await executeQuery(updateNewFilePathQuery);
        
    };

    getWebsiteFrontImageUrlByCategory = async (category: any) => {
        const query = `SELECT * FROM FrontImages WHERE category = '${category}'`;
        const frontImage = await retrieveData(query);

        if (frontImage[0]) {
            // Construct the full URL using the base URL from config and the image path
            const relativePath = formateFrontImagePath(frontImage[0].imagePath);

            return {
                image_url: `${getEnvVar("LOCAL_URL")}/assets${relativePath}`,
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

    uploadClientWebsiteBanner = async (
        requestData: Record<string, any>,
        file: Express.Multer.File
    ) => {
        // Insert into ClientWebsiteBanners table
        const query = `INSERT INTO ClientWebsiteBanners (user_id, imagePath) VALUES (${requestData.user_id}, '${file.path}')`;
        await executeQuery(query);
    };

    getClientWebsiteBanner = async (page?: number, limit?: number) => {
        
        let query = `SELECT cb.*, u.full_name, u.email FROM ClientWebsiteBanners cb LEFT JOIN Users u ON cb.user_id = u.id`;

         // Add pagination to the query
         if (page && limit) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        // append base url to imagePath
        const result = await executeQuery(query);
        const resultWithFullUrl = result.rows.map((row) => {
            const relativePath = formateFrontImagePath(row.imagePath);
            const fullImagePath = `${getEnvVar("LOCAL_URL")}/assets${relativePath}`;
            return { ...row, imagePath: fullImagePath };
        });
        return resultWithFullUrl;
    };

    isExistClientWebsiteBanner = async (user_id: number) => {
        const query = `SELECT * FROM ClientWebsiteBanners WHERE user_id = ${user_id}`;
        const result = await executeQuery(query);
        return result.rows[0];
    };


    deleteClientWebsiteBanner = async (bannerId: number) => {
        const oldBannerQuery = `SELECT * FROM ClientWebsiteBanners WHERE id = ${bannerId}`;
        const oldBannerData = await executeQuery(oldBannerQuery);
        if (oldBannerData.rows[0]) {
            removeFile(oldBannerData.rows[0].imagePath);
        }
        const query = `DELETE FROM ClientWebsiteBanners WHERE id = ${bannerId}`;
        await executeQuery(query);
    };

    updateClientWebsiteBanner = async (
        banner_id: number,
        file: Express.Multer.File
    ) => {
        // firnd the exisitng image path and remove from the folder
        const query = `SELECT * FROM ClientWebsiteBanners WHERE id = ${banner_id}`;
        const existingImagePath = await executeQuery(query);
        if (existingImagePath.rows[0]) {
            removeFile(existingImagePath.rows[0].imagePath);
        }
        const updateQuery = `UPDATE ClientWebsiteBanners SET imagePath = '${file.path}' WHERE id = ${banner_id}`;
        await executeQuery(updateQuery);
    };

    // Training files
    addTrainingFiles = async (file: Express.Multer.File, adminId: number, issue_date: string, file_name: string) => {
        const query = `INSERT INTO TrainingFiles (adminId, filePath, mime_type, size, filename, issue_date) VALUES (${adminId}, '${file.path}', '${file.mimetype}', ${file.size}, '${file_name}', '${issue_date}')`;
        await executeQuery(query);
    };

    getTrainingFiles = async (page?: number, limit?: number, status?: string) => {
        let query = `SELECT * FROM TrainingFiles`;

        // Add filtering based on status
        if (status === 'current') {
            query += ` WHERE issue_date <= GETDATE()`;
        } else if (status === 'upcoming') {
            query += ` WHERE issue_date > GETDATE()`;
        }

        console.log(query);

        // Add pagination to the query
        if (page && limit) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const trainingFiles = await retrieveData(query);
        const trainingFilesWithFullUrl = trainingFiles.rows.map((trainingFile) => {
                const relativePath = formateFrontImagePath(trainingFile.filePath);
                const fullImagePath = `${getEnvVar("LOCAL_URL")}/assets${relativePath}`;
    
                return {
                ...trainingFile,
                filePath: fullImagePath,
            };
        });
        return trainingFilesWithFullUrl;
    }

    deleteTrainingFiles = async (fileId: number) => {
        const query = `SELECT * FROM TrainingFiles WHERE id = ${fileId}`;
        const existingImagePath = await executeQuery(query);
        if (existingImagePath.rows[0]) {
            removeFile(existingImagePath.rows[0].filePath);
        }
        const deleteQuery = `DELETE FROM TrainingFiles WHERE id = ${fileId}`;
        await executeQuery(deleteQuery);
    }

    updateTrainingFiles = async (fileId: number, file: Express.Multer.File, issue_date: string, filename: string) => {
        if (file) {
            const query = `SELECT * FROM TrainingFiles WHERE id = ${fileId}`;
            const existingImagePath = await executeQuery(query);
            if (existingImagePath.rows[0]) {
                removeFile(existingImagePath.rows[0].filePath);
            }
        }
        const updateQuery = `UPDATE TrainingFiles SET ${file ? `filePath = '${file.path}',` : ''} issue_date = '${issue_date}', filename = '${filename}' WHERE id = ${fileId}`;
        await executeQuery(updateQuery);
    }
}
