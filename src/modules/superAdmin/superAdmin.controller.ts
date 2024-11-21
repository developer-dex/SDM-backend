import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { SuperAdminService } from "./superAdmin.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { IChangeNotificationStatusRequest, IClientRequest, IGetAllClientsRequest, ISignInRequest } from "./superAdmin.interface";
import json2csv from "json2csv";

export class SuperAdminController {
    private responseService: ResponseService;
    private superAdminService: SuperAdminService;

    constructor() {
        this.responseService = new ResponseService();
        this.superAdminService = new SuperAdminService();
    }

    signIn = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const requestData: ISignInRequest = req.body;
        try {
            const result = await this.superAdminService.signIn(requestData);
            if (!result) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .send(this.responseService.responseWithoutData(false, StatusCodes.BAD_REQUEST, "Invalid email or password"));
            }
            return res
                .status(StatusCodes.OK)
                .send(this.responseService.responseWithData(false, StatusCodes.OK, "Sign in successfully", result));
        } catch (error) {
            console.log("superAdmin signIn ERROR", error);
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getAllClients = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { limit, page, searchParameter } =
            req.query as unknown as IGetAllClientsRequest;
        const token_payload = req.token_payload;
        try {
            const clients = await this.superAdminService.getAllClients(
                page,
                limit,
                searchParameter
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Clients fetched successfully",
                        clients
                    )
                );
        } catch (error) {
            console.log("superAdmin ERROR", error);
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

    deleteClient = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { userId } = req.params;
        const token_payload = req.token_payload;
        try {
            await this.superAdminService.deleteClient(Number(userId));
        } catch (error) {}
    };

    updateUserData = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const token_payload = req.token_payload;
        console.log("token_payload:::", token_payload);
        const userId = token_payload.data._id;
        const requestData: IClientRequest = req.body;
        const whereConfition = `email = '${requestData.email}'`;
        try {
            // const isExistClient = await this.superAdminService.isExistClient(
            //     whereConfition
            // );
            // if (!isExistClient[0]) {
            //     return res
            //         .status(200)
            //         .send(
            //             this.responseService.responseWithoutData(
            //                 false,
            //                 StatusCodes.BAD_REQUEST,
            //                 "Client not found"
            //             )
            //         );
            // }
    
            await this.superAdminService.updateClient(requestData, userId);
            return res
                .status(200)
                .send(this.responseService.responseWithoutData(true, StatusCodes.OK, "User updated successfully"));
        } catch (error) {
            return res
                .status(200)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }

    };

    addClient = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        try {
            await this.superAdminService.addClient(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "User added successfully"
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

    exportCSV = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const clients = await this.superAdminService.getAllClients();
        const csv = json2csv.parse(clients);
        return res.status(200).send(csv);
    };


    // Notification Module
    getAllNotifications = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            console.log("getAllNotifications:::ENTRY");
            const notifications =
                await this.superAdminService.getNotifications();
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Notifications fetched successfully",
                        notifications
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

    changeNotificationStatus = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: IChangeNotificationStatusRequest = req.body;
        try {
            await this.superAdminService.changeNotificationStatus(requestData);
            return res.status(200).send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Notification status changed successfully"));
        } catch (error) {
            return res.status(200).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }
}

export const superAdminController = new SuperAdminController();
