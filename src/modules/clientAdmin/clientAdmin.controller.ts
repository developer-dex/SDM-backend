import { Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { ClientAdminService } from "./clientAdmin.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { paginationRequeset } from "./clientAdmin.interface";

export class ClientAdminController {
    private responseService: ResponseService;
    private clientAdminService: ClientAdminService;

    constructor() {
        this.responseService = new ResponseService();
        this.clientAdminService = new ClientAdminService();
    }

    getBackupSS = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const { limit, page } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getBackupSS(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit)
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Backup ss fetched successfully",
                        result
                    )
                );
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getBackupSSCounts = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const result = await this.clientAdminService.getBackupSSCounts(
                tokenPayload?.data.databaseName
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(false, StatusCodes.OK, "Backup ss counts fetched successfully", result));
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getPingAndpath = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const { limit, page } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getPingAndPath(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit)
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Ping and path fetched successfully",
                        result
                    )
                );
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getPingAndPathCounts = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const result = await this.clientAdminService.getPingAndPathCounts(
                tokenPayload?.data.databaseName
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(false, StatusCodes.OK, "Ping and path counts fetched successfully", result));
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getAuditTrailLog = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const { limit, page, searchParameter } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getAuditTrailLog(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                searchParameter
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Audit trail log fetched successfully",
                        result
                    )
                );
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    // User management
    getUsersList = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const { limit, page, searchParameter } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getUsersList(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                searchParameter
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(false, StatusCodes.OK, "Users list fetched successfully", result));
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }
}

export const clientAdminController = new ClientAdminController();
