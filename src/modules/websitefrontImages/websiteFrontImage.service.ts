import moment from "moment";
import { createAuditTrail } from "../../common/function";
import { executeQuery, retrieveData } from "../../config/databaseConfig";
import { Actions, Modules, UPLOAD_PATH } from "../../helpers/constants";
import getEnvVar, {
    calculatePagination,
    currentLocation,
    formateFrontImagePath,
    getFileName,
    getIpAddressFromRequest,
    getThePageNameFromCategory,
    removeFile,
} from "../../helpers/util";
import pkg from "ip";

export class WebsiteFrontImageService {
    constructor() {}

    updateWebsiteFrontImage = async (
        requestData: Record<string, any>,
        file: Express.Multer.File,
        token_payload: any
    ) => {
        console.log("file path", file.path);
        const query = `SELECT * FROM FrontImage WHERE category = '${requestData.category}'`;
        const isExistImagePath = await executeQuery(query);

        if (isExistImagePath.rows[0]) {
            removeFile(isExistImagePath.rows[0].imagePath);
        }

        const updateNewFilePathQuery = `UPDATE FrontImage SET imagePath = '${file.path}' WHERE category = '${requestData.category}'`;
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.WEBSITE_BANNER,
            action: Actions.WEBSITE_BANNER.UPDATE,
        };
        await createAuditTrail(data);
        await executeQuery(updateNewFilePathQuery);
    };

    getWebsiteFrontImageUrlByCategory = async (
        category: any,
        req: any,
        res: any
    ) => {
        const query = `SELECT * FROM FrontImage WHERE category = '${category}'`;
        const frontImage = await executeQuery(query);
        this.logPageVisit(req, res, category);

        if (frontImage.rows[0]) {
            // Construct the full URL using the base URL from config and the image path
            // const relativePath = formateFrontImagePath(
            //     frontImage.rows[0].imagePath
            // );

            return {
                image_url: `${getEnvVar("LOCAL_URL")}/${frontImage.rows[0].imagePath}`,
            };
        }
        return null;
    };

    logPageVisit = async (req: any, res: Response, category: string) => {
        const { address } = pkg;
        // Get the current machine's IP address
        const ipAddress = address();
        console.log("_________________________________", ipAddress)
        // let ipAddress = getIpAddressFromRequest(req);

        let userType = "guest";
        // Check if the IP address exists in the User table
        const existIpAddressQuery = `SELECT * FROM Users WHERE ipAddress = '${ipAddress}'`;
        const existIpAddress = await executeQuery(existIpAddressQuery);

        if (existIpAddress.rows[0]) {
            userType = existIpAddress.rows[0].full_name; // Set user type to existUser if found
        }

        const location = await currentLocation(ipAddress);
        const pageVisit = getThePageNameFromCategory(category);
        const insertAnalyticsQuery = `INSERT INTO Analytics (IpAddress, Location, UserType, PageVisit) VALUES ('${ipAddress}', '${location}', '${userType}', '${pageVisit}')`;
        await executeQuery(insertAnalyticsQuery);
    };

    getAllWebsiteFrontImages = async () => {
        const query = `SELECT * FROM FrontImage`;
        const frontImages = await retrieveData(query);
        const frontImagesWithFullUrl = frontImages.rows.map((frontImage) => {
            // const relativePath = formateFrontImagePath(frontImage.imagePath);
            const fullImagePath = `${getEnvVar("LOCAL_URL")}/${frontImage.imagePath}`;

            return {
                ...frontImage,
                imagePath: fullImagePath,
            };
        });
        return frontImagesWithFullUrl;
    };

    uploadClientWebsiteBanner = async (
        requestData: any,
        file: Express.Multer.File,
        token_payload: any
    ) => {

        console.log("requestData", requestData);

        // Split the user IDs from the requestData
        const userIds = requestData.user_id.split(',').map(id => id.trim());
        console.log("userIds", userIds);

        // Delete existing records for the user IDs
        const deleteQuery = `DELETE FROM ClientWebsiteBanners WHERE user_id IN (${userIds.join(',')})`;
        await executeQuery(deleteQuery);

        // Prepare a single query to insert the data for each user
        const insertValues = userIds.map(id => `(${id}, '${file.path}')`).join(',');
        const insertQuery = `INSERT INTO ClientWebsiteBanners (user_id, imagePath) VALUES ${insertValues}`;

        console.log("insertQuery", insertQuery);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.CLIENT_BANNER,
            action: Actions.CLIENT_BANNER.ADD,
        };
        await createAuditTrail(data);
        await executeQuery(insertQuery);
    };

    getClientWebsiteBanner = async (page?: number, limit?: number) => {
        let query = `SELECT cb.*, u.full_name, u.email FROM ClientWebsiteBanners cb LEFT JOIN Users u ON cb.user_id = u.id`;

        // Add pagination to the query
        if (page && limit) {
            const { offset, limit: limitData } = calculatePagination(
                page,
                limit
            );
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        // append base url to imagePath
        const result = await executeQuery(query);
        const resultWithFullUrl = result.rows.map((row) => {
            const relativePath = formateFrontImagePath(row.imagePath);
            const fullImagePath = `${getEnvVar("LOCAL_URL")}/${row.imagePath}`;
            return { ...row, imagePath: fullImagePath };
        });
        return resultWithFullUrl;
    };

    isExistClientWebsiteBanner = async (user_id: string) => {
        const query = `SELECT * FROM ClientWebsiteBanners WHERE user_id = ${user_id}`;
        const result = await executeQuery(query);
        return result.rows[0];
    };

    deleteClientWebsiteBanner = async (bannerId: number, token_payload: any) => {
        const oldBannerQuery = `SELECT * FROM ClientWebsiteBanners WHERE id = ${bannerId}`;
        const oldBannerData = await executeQuery(oldBannerQuery);
        if (oldBannerData.rows[0]) {
            removeFile(oldBannerData.rows[0].imagePath);
        }
        const query = `DELETE FROM ClientWebsiteBanners WHERE id = ${bannerId}`;
        await executeQuery(query);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.CLIENT_BANNER,
            action: Actions.CLIENT_BANNER.DELETE,
        };
        await createAuditTrail(data);
    };

    updateClientWebsiteBanner = async (
        banner_id: number,
        file: Express.Multer.File,
        token_payload: any
    ) => {
        // firnd the exisitng image path and remove from the folder
        const query = `SELECT * FROM ClientWebsiteBanners WHERE id = ${banner_id}`;
        const existingImagePath = await executeQuery(query);
        if (existingImagePath.rows[0]) {
            removeFile(existingImagePath.rows[0].imagePath);
        }
        const updateQuery = `UPDATE ClientWebsiteBanners SET imagePath = '${file.path}' WHERE id = ${banner_id}`;
        await executeQuery(updateQuery);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.CLIENT_BANNER,
            action: Actions.CLIENT_BANNER.UPDATE,
        };
        await createAuditTrail(data);
    };

    // Training files
    addTrainingFiles = async (
        file: Express.Multer.File,
        adminId: number,
        issue_date: string,
        file_name: string,
        token_payload: any
    ) => {
        const query = `INSERT INTO TrainingFiles (adminId, filePath, mime_type, size, filename, issue_date) VALUES (${adminId}, '${file.path}', '${file.mimetype}', ${file.size}, '${file_name}', '${issue_date}')`;
        await executeQuery(query);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.TRAINING_FILES,
            action: Actions.TRAINING_FILES.ADD,
        };
        await createAuditTrail(data);
    };

    getTrainingFiles = async (
        page?: number,
        limit?: number,
        status?: string
    ) => {
        let query = `SELECT * FROM TrainingFiles`;

        // Add filtering based on status
        if (status === "current") {
            query += ` WHERE issue_date <= GETDATE()`;
        } else if (status === "upcoming") {
            query += ` WHERE issue_date > GETDATE()`;
        }

        console.log(query);

        // Add pagination to the query
        if (page && limit) {
            const { offset, limit: limitData } = calculatePagination(
                page,
                limit
            );
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const trainingFiles = await retrieveData(query);
        const trainingFilesWithFullUrl = trainingFiles.rows.map(
            (trainingFile) => {
                const relativePath = formateFrontImagePath(
                    trainingFile.filePath
                );
                const fullImagePath = `${getEnvVar("LOCAL_URL")}/${trainingFile.filePath}`;

                return {
                    ...trainingFile,
                    filePath: fullImagePath,
                };
            }
        );
        return trainingFilesWithFullUrl;
    };

    deleteTrainingFiles = async (fileId: number, token_payload: any) => {
        const query = `SELECT * FROM TrainingFiles WHERE id = ${fileId}`;
        const existingImagePath = await executeQuery(query);
        if (existingImagePath.rows[0]) {
            removeFile(existingImagePath.rows[0].filePath);
        }
        const deleteQuery = `DELETE FROM TrainingFiles WHERE id = ${fileId}`;
        await executeQuery(deleteQuery);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.TRAINING_FILES,
            action: Actions.TRAINING_FILES.DELETE,
        };
        await createAuditTrail(data);
    };

    updateTrainingFiles = async (
        fileId: number,
        file: Express.Multer.File,
        issue_date: string,
        filename: string,
        token_payload: any
    ) => {
        if (file) {
            const query = `SELECT * FROM TrainingFiles WHERE id = ${fileId}`;
            const existingImagePath = await executeQuery(query);
            if (existingImagePath.rows[0]) {
                removeFile(existingImagePath.rows[0].filePath);
            }
        }
        const updateQuery = `UPDATE TrainingFiles SET ${file ? `filePath = '${file.path}',` : ""} issue_date = '${issue_date}', filename = '${filename}' WHERE id = ${fileId}`;
        await executeQuery(updateQuery);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            role: token_payload.role,
            module: Modules.TRAINING_FILES,
            action: Actions.TRAINING_FILES.UPDATE,
        };
        await createAuditTrail(data);
    };
}
