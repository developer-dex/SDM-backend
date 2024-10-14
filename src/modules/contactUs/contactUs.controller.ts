import { NextFunction, Request, Response } from "express";
import { IContactUsRequest } from "./contactUs.interface";
import { ContactUsService } from "./contactUs.service";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";

export class ContactUsController {
    constructor(
        private contactUsService = new ContactUsService(),
        private responseService = new ResponseService()
    ) {}

    async contactUsRequest(req: Request, res: Response, next: NextFunction) {
        const requestData: IContactUsRequest = req.body;
        try {
            await this.contactUsService.contactUsRequest(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Request for contact us created successfully"
                    )
                );
        } catch (error) {
            return next(error);
        }
    }
}

export const contactUsController = new ContactUsController();
