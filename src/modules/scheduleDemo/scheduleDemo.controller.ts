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
    private scheduleDemoService: ScheduleDemoService;
    private responseService: ResponseService;

    constructor() {
        this.scheduleDemoService = new ScheduleDemoService();
        this.responseService = new ResponseService();
    }

    scheduleDemoRequest = async (
        req: ValidatedRequest<IValidationRequestBodySchema<IScheduleDemoBody>>,
        res: Response,
        next: NextFunction
    ) => {
        const requestData: IScheduleDemoBody = req.body;
        try {
            await this.scheduleDemoService.crateScheduleDemo(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Request for schedule demo created successfully"
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
}

export const scheduleDemoController = new ScheduleDemoController();
