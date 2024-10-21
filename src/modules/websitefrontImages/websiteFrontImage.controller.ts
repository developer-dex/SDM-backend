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
            console.log("eeee", error);
            return next(error);
        }
    };

    getFrontImage = async (req: Request, res: Response, next: NextFunction) => {
        const pageType = req.query.category;
        try {
            const frontImage =
                await this.websiteFrontImageService.getWebsiteFrontImageUrlByCategory(
                    pageType
                );
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
            console.log("eeee", error);
            return next(error);
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
            return next(error);
        }
    };
}

export const websiteFrontImageController = new WebsiteFrontImageController();
