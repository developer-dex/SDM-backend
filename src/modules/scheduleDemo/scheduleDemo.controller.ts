import { NextFunction, Response } from "express";
import { ScheduleDemoService } from "./scheduleDemo.service";
import {
    IValidationRequestBodySchema,
    IScheduleDemoBody,
} from "./scheduleDemo.interface";
import { ValidatedRequest } from "express-joi-validation";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";

export class ScheduleDemoController {
    constructor(
        private schduleDemoService = new ScheduleDemoService(),
        private responseService = new ResponseService()
    ) {}

    async scheduleDemoRequest(
        req: ValidatedRequest<IValidationRequestBodySchema<IScheduleDemoBody>>,
        res: Response,
        next: NextFunction
    ) {
        const requestData: IScheduleDemoBody = req.body;
        try {
            await this.schduleDemoService.crateScheduleDemo(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Request for schedule demo created successfully"
                    )
                );
        } catch (error) {
            return next(error);
        }
    }
}

export const scheduleDemoController = new ScheduleDemoController();
