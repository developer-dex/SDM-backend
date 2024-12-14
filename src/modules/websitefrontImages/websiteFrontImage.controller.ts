import { NextFunction, Request, Response } from "express";
import { WebsiteFrontImageService } from "./websiteFrontImage.service";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";

export class WebsiteFrontImageController {
    private responseService: ResponseService;
    private websiteFrontImageService: WebsiteFrontImageService;

    constructor() {
        this.responseService = new ResponseService();
        this.websiteFrontImageService = new WebsiteFrontImageService();
    }

    updateFrontImage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        const frontImage = req.file;
        try {
            await this.websiteFrontImageService.updateWebsiteFrontImage(
                requestData,
                frontImage
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Image updated successfully"
                    )
                );
        } catch (error) {
            console.log("updateFrontImage error:::", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getFrontImage = async (req: Request, res: Response, next: NextFunction) => {
        const pageType = req.query.category;
        try {
            const frontImage =
                await this.websiteFrontImageService.getWebsiteFrontImageUrlByCategory(
                    pageType
                );
                console.log("frontImage:::", frontImage);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Image fetched successfully",
                        frontImage
                    )
                );
        } catch (error) {
            console.log("getFrontImage error:::", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getAllFrontImages = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const frontImages =
                await this.websiteFrontImageService.getAllWebsiteFrontImages();
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Images fetched successfully",
                        frontImages
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    // Client Website Banner
    uploadClientWebsiteBanner = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        const bannerImage = req.file;
        try {
            const isExist = await this.websiteFrontImageService.isExistClientWebsiteBanner(requestData.user_id);
            if (isExist) {
                return res
                    .status(400)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.BAD_REQUEST,
                            "Banner already exists in this user. Please update the existing banner."
                        )
                    );
            }
            await this.websiteFrontImageService.uploadClientWebsiteBanner(
                requestData,
                bannerImage
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Banner uploaded successfully"
                    )
                );
        } catch (error) {
            console.log("add website banner error::", error)
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getClientWebsiteBanner = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        // const user_id = parseInt(req.query.user_id as string);
        const { page, limit } = req.query;
        try {
            const banner =
                await this.websiteFrontImageService.getClientWebsiteBanner(
                    Number(page),
                    Number(limit)
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Banner fetched successfully",
                        banner
                    )
                );
        } catch (error) {
            console.log("getClientWebsiteBanner error", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    deleteClientWebsiteBanner = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const bannerId = parseInt(req.params.bannerId);
        try {
            await this.websiteFrontImageService.deleteClientWebsiteBanner(
                bannerId
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Banner deleted successfully"
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    updateClientWebsiteBanner = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const { banner_id } = req.body;
        const bannerImage = req.file;
        try {
            await this.websiteFrontImageService.updateClientWebsiteBanner(
                banner_id,
                bannerImage
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Banner updated successfully"
                    )
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    addTrainingFiles = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const trainingFile = req.file;
        const tokenPayload = req.token_payload;
        const { issue_date, file_name } = req.body;
        console.log(trainingFile, tokenPayload, issue_date, file_name);
        try {
            await this.websiteFrontImageService.addTrainingFiles(
                trainingFile,
                tokenPayload?.data.id,
                issue_date,
                file_name
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Training file added successfully"
                    )
                );
        } catch (error) {
            console.log("training file post error", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getTrainingFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, status } = req.query;
            console.log(page, limit, status);
            const trainingFiles = await this.websiteFrontImageService.getTrainingFiles(Number(page), Number(limit), status as string);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Training files fetched successfully",
                        trainingFiles
                    )
                );
        } catch (error) {
            console.log("training file get error", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    }

    deleteTrainingFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const fileId = parseInt(req.params.fileId);
            await this.websiteFrontImageService.deleteTrainingFiles(fileId);
            return res
                .status(200)
                .send(
                this.responseService.responseWithoutData(false, StatusCodes.OK, "Training file deleted successfully")
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error")
                );
        }
    }

    updateTrainingFiles = async (req: Request, res: Response, next: NextFunction) => {
        const fileId = parseInt(req.params.fileId);
        const file = req.file;
        const { issue_date, filename } = req.body;
        try {
            await this.websiteFrontImageService.updateTrainingFiles(fileId, file, issue_date, filename);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.OK, "Training file updated successfully")
                );
        } catch (error) {
            return res
                .status(200)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }
}

export const websiteFrontImageController = new WebsiteFrontImageController();
