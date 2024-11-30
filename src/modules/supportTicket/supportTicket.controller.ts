import { NextFunction, Request, Response } from "express";
import { SupportTicketService } from "./supportTicket.service";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { createSupportTicketRequest } from "../clientAdmin/clientAdmin.interface";

export class SupportTicketController {
    private supportTicketService: SupportTicketService;
    private responseService: ResponseService;

    constructor() {
        this.supportTicketService = new SupportTicketService();
        this.responseService = new ResponseService();
    }

    createSupportTicket = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: createSupportTicketRequest = req.body;
        const token_payload = req.token_payload;
        try {
            await this.supportTicketService.createSupportTicket(
                token_payload.data.id,
                requestData
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Support ticket created successfully"
                    )
                );
        } catch (error) {
            return res
                .status(500)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getSupportTicket = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const token_payload = req.token_payload;
        try {
            const { page, limit } = req.query;
            const supportTicketData =
                await this.supportTicketService.getSupportTicket(
                    token_payload.data.id,
                    Number(page),
                    Number(limit)
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Support ticket fetched successfully",
                        supportTicketData
                    )
                );
        } catch (error) {}
    };

    updateSupportTicket = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const token_payload = req.token_payload;
        const requestData = req.body;
        try {
            await this.supportTicketService.changeSupportTicketStatus(
                requestData,
                token_payload.data
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Support ticket status changed successfully"
                    )
                );
        } catch (error) {
            return res
                .status(500)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getAllSupportTicket = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const token_payload = req.token_payload;
        try {
            const { page, limit, isExportToEmail, recipientEmail, searchParameter, createdAt, Topic, status, endTime, is_on_time } =
                req.query as unknown as {
                    page: number;
                    limit: number;
                    isExportToEmail?: string;
                    recipientEmail?: string;
                    searchParameter?: string;
                    createdAt?: string;
                    Topic?: string;
                    status?: string;
                    endTime?: string;
                    is_on_time?: string;
                };
            const supportTicketData =
                await this.supportTicketService.getAllSupportTicket(
                    Number(page),
                    Number(limit),
                    Boolean(isExportToEmail),
                    recipientEmail,
                    searchParameter,
                    createdAt,
                    Topic,
                    status,
                    endTime,
                    is_on_time
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Support ticket fetched successfully",
                        supportTicketData
                    )
                );
        } catch (error) {}
    };

    changeSupportTicketStatus = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const token_payload = req.token_payload;
        const requestData = req.body;
        try {
            await this.supportTicketService.changeSupportTicketStatus(
                requestData,
                token_payload.data
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Support ticket status changed successfully"
                    )
                );
        } catch (error) {}
    };
}

export const supportTicketController = new SupportTicketController();
