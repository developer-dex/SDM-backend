import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { SuperAdminService } from "./superAdmin.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import {
    IChangeNotificationStatusRequest,
    ICreateClientRequest,
    ICreateLicenseRequest,
    IGetAllUsersRequest,
    ISignInRequest,
    IUserRequest,
} from "./superAdmin.interface";
import json2csv from "json2csv";

export class SuperAdminController {
    private responseService: ResponseService;
    private superAdminService: SuperAdminService;

    constructor() {
        this.responseService = new ResponseService();
        this.superAdminService = new SuperAdminService();
    }

    signIn = async (req: Request, res: Response, next: NextFunction) => {
        const requestData: ISignInRequest = req.body;
        try {
            const result = await this.superAdminService.signIn(requestData);
            if (!result || result.length === 0) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.BAD_REQUEST,
                            "Invalid email or password"
                        )
                    );
            }
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Sign in successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("superAdmin signIn ERROR", error);
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

    getAllUsers = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { limit, page, searchParameter } =
            req.query as unknown as IGetAllUsersRequest;
        const token_payload = req.token_payload;
        try {
            const clients = await this.superAdminService.getAllUsers(
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

    deleteUser = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { userId } = req.params;
        try {
            await this.superAdminService.deleteUser(Number(userId));
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "User deleted successfully"
                    )
                );
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
        const requestData: IUserRequest = req.body;
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

            await this.superAdminService.updateUser(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "User updated successfully"
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
        const clients = await this.superAdminService.getAllUsers();
        const csv = json2csv.parse(clients.admins);
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
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Notification status changed successfully"
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

    // Client Management

    getAllClients = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const {
            limit,
            page,
            searchParameter,
            company_name,
            company_address,
            start_date,
            end_date,
            payment_method,
            status,
        } = req.query as unknown as IGetAllUsersRequest;
        try {
            const clients = await this.superAdminService.getAllClients(
                limit,
                page,
                searchParameter,
                company_name,
                company_address,
                start_date,
                end_date,
                payment_method,
                status
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
            console.log("superAdmin getAllClients ERROR", error);
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

    createClient = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: ICreateClientRequest = req.body;
        try {
            await this.superAdminService.createClient(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Client created successfully"
                    )
                );
        } catch (error) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        error.message
                    )
                );
        }
    };

    deleteClient = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { companyId } = req.params;
        try {
            await this.superAdminService.deleteClient(companyId);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "User deleted successfully"
                    )
                );
        } catch (error) {}
    };

    updateClient = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: ICreateClientRequest = req.body;
        try {

            // Check that updated pan number  OR gst numberis already exist in other client
            const isPanNumberExist = await this.superAdminService.getDatabyConnection(`SELECT * FROM ClientManagement WHERE pan = '${requestData.pan_number}'`);
            console.log("isPanNumberExist:::", isPanNumberExist[0].company_id, requestData.company_id);
            if (isPanNumberExist[0].company_id === requestData.company_id) {
                return res.status(StatusCodes.BAD_REQUEST).send(this.responseService.responseWithoutData(false, StatusCodes.BAD_REQUEST, "Pan number already exist"));
            }
            // Also checek for the gst number is already exist in other client
            const isGstNumberExist = await this.superAdminService.getDatabyConnection(`SELECT * FROM ClientManagement WHERE gst = '${requestData.gst_number}'`);
            if (isGstNumberExist[0].company_id === requestData.company_id) {
                return res.status(StatusCodes.BAD_REQUEST).send(this.responseService.responseWithoutData(false, StatusCodes.BAD_REQUEST, "Gst number already exist"));
            }


            await this.superAdminService.updateClient(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Client updated successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin updateClient ERROR", error);
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

    // Licenses Management
    getAllLicenses = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit } = req.query as unknown as {
                page: number;
                limit: number;
            };
            const licenses = await this.superAdminService.getAllLicenses(
                page,
                limit
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Licenses fetched successfully",
                        licenses
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

    createLicense = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: ICreateLicenseRequest = req.body;
        console.log("requestData:::", requestData);
        try {
            await this.superAdminService.createLicense(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "License created successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin createLicense ERROR", error);
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

    deleteLicense = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { licenseId } = req.params;
        try {
            await this.superAdminService.deleteLicense(Number(licenseId));
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "License deleted successfully"
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

    updateLicense = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: ICreateLicenseRequest = req.body;
        try {
            await this.superAdminService.updateLicense(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "License updated successfully"
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

    // Customer Management

    getAllCustomers = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        // const { limit, page } = req.query as unknown as IGetAllUsersRequest;
        try {
            const customers = await this.superAdminService.getAllCustomers();
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(true, StatusCodes.OK, "Customers fetched successfully", customers)
                );
        } catch (error) {
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error")
                );
        }
    }
}

export const superAdminController = new SuperAdminController();
