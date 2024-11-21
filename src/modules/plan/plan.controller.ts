import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { PlanService } from "./plan.service";

export class PlanController {
    private responseService: ResponseService;
    private planService: PlanService;

    constructor() {
        this.responseService = new ResponseService();
        this.planService = new PlanService();
    }

    createPlan = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;

        try {
            const createdPlan = await this.planService.createPlan(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Request for schedule demo created successfully",
                        createdPlan
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

    listing = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const isAdminSide = req.query.isAdminSide === "true";
            console.log("isAdminSide: ", isAdminSide);
            
            const plans = await this.planService.listing(isAdminSide);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Plans fetched successfully",
                        plans
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

    changePlanStatus = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { planId, userId } = req.body;
            const planData = await this.planService.changePlanStatus(
                planId,
                userId
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Plan status changed successfully",
                        planData
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

    createOffer = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const requestData = req.body;
            const createdOffer = await this.planService.createOffer(requestData);
        } catch (error) {
            
        }
    }
}

export const planController = new PlanController();
