import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { SuperAdminService } from "./superAdmin.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import {
    IChangeNotificationStatusRequest,
    ICreateAuditLogRequest,
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
        const { limit, page, searchParameter, isExportToEmail, recipientEmail, full_name, email, phoneNo, role, permissions, password, created_at } =
            req.query as unknown as IGetAllUsersRequest;
        try {
            const clients = await this.superAdminService.getAllUsers(
                page,
                limit,
                searchParameter,
                Boolean(isExportToEmail),
                recipientEmail,
                full_name,
                email,
                phoneNo,
                role,
                permissions,
                password,
                created_at
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
        const token_payload = req.token_payload;
        try {
            await this.superAdminService.deleteUser(
                Number(userId),
                token_payload.data
            );
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
        const requestData: IUserRequest = req.body;
        const whereConfition = `email = '${requestData.email}'`;
        console.log("requestData:::", requestData);
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

            await this.superAdminService.updateUser(
                requestData,
                token_payload.data
            );
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
        const token_payload = req.token_payload;
        try {
            await this.superAdminService.addClient(
                requestData,
                token_payload.data
            );
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
            isExportToEmail,
            recipientEmail,
            gst,
            pan,
            industry_type,
            cost
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
                status,
                Boolean(isExportToEmail),
                recipientEmail,
                gst,
                pan,
                industry_type,
                cost
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
            const isPanNumberExist =
                await this.superAdminService.getDatabyConnection(
                    `SELECT * FROM ClientManagement WHERE pan = '${requestData.pan_number}'`
                );
            console.log(
                "isPanNumberExist:::",
                isPanNumberExist[0].company_id,
                requestData.company_id
            );
            if (isPanNumberExist[0].company_id !== requestData.company_id) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.BAD_REQUEST,
                            "Pan number already exist"
                        )
                    );
            }
            // Also checek for the gst number is already exist in other client
            const isGstNumberExist =
                await this.superAdminService.getDatabyConnection(
                    `SELECT * FROM ClientManagement WHERE gst = '${requestData.gst_number}'`
                );
            if (isGstNumberExist[0].company_id !== requestData.company_id) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.BAD_REQUEST,
                            "Gst number already exist"
                        )
                    );
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
            const { page, limit, isExportToEmail, recipientEmail, searchParameter, issue_date, expiry_date, expiration_date, license_key, license_type, status, company_id, company_name, company_pan, user_email } = req.query as unknown as {
                page: number;
                limit: number;
                isExportToEmail?: string;
                recipientEmail?: string;
                searchParameter?: string,
                issue_date?: string,
                expiry_date?: string,
                expiration_date?: string,
                license_key?: string,
                license_type?: string,
                status?: string,
                company_id?: string,
                company_name?: string,
                company_pan?: string,
                user_email?: string
            };
            const licenses = await this.superAdminService.getAllLicenses(
                page,
                limit,
                Boolean(isExportToEmail),
                recipientEmail,
                searchParameter,
                issue_date,
                expiry_date,
                expiration_date,
                license_key,
                license_type,
                status,
                company_id,
                company_name,
                company_pan,
                user_email
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
            console.log("update license:::", error)
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
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Customers fetched successfully",
                        customers
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

    // Audit Logs
    createAuditLog = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const requestData: ICreateAuditLogRequest = req.body;
            await this.superAdminService.createAuditLog(
                requestData,
                req.token_payload.data
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Audit log created successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin createAuditLog ERROR", error);
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

    getAllAuditLogs = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit, isExportToEmail, recipientEmail, searchParameter, createdAt, username, role, module, action, loginTime, logoutTime, start_from, end_to } = req.query as unknown as {
                page: number;
                limit: number;
                isExportToEmail?: boolean;
                recipientEmail?: string;
                searchParameter?: string;
                createdAt?: string;
                username?: string;
                role?: string;
                module?: string;
                action?: string;
                loginTime?: string;
                logoutTime?: string;
                start_from?: string;
                end_to?: string;
            };
            const auditLogs = await this.superAdminService.getAllAuditLogs(
                page,
                limit,
                Boolean(isExportToEmail),
                recipientEmail,
                searchParameter,
                createdAt,
                username,
                role,
                module,
                action,
                loginTime,
                logoutTime,
                start_from,
                end_to
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Audit logs fetched successfully",
                        auditLogs
                    )
                );
        } catch (error) {
            console.log("superAdmin getAllAuditLogs ERROR", error);
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

    // Dashboard Temp
    dashboardDetails = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            // const requestData = req.body;
            const data = await this.superAdminService.dashboardDetails();
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Dashboard temp fetched successfully",
                        data
                    )
                );
        } catch (error) {
            console.log("superAdmin dashboardTemp ERROR", error);
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

    // support ticket management
    getAllSupportTicketTitles = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit } = req.query as unknown as {
                page: number;
                limit: number;
            };
            const supportTicketTitles =
                await this.superAdminService.getAllSupportTicketTitles(
                    page,
                    limit
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Support ticket titles fetched successfully",
                        supportTicketTitles
                    )
                );
        } catch (error) {
            console.log("superAdmin getAllSupportTicketTitles ERROR", error);
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

    addSupportTicketTitle = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const requestData = req.body;
            await this.superAdminService.addSupportTicketTitle(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Support ticket title added successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin addSupportTicketTitle ERROR", error);
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

    deleteSupportTicketTitle = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { titleId } = req.params;
            await this.superAdminService.deleteSupportTicketTitle(
                Number(titleId)
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Support ticket title deleted successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin deleteSupportTicketTitle ERROR", error);
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

    updateSupportTicketTitle = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const requestData = req.body;
            await this.superAdminService.updateSupportTicketTitle(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Support ticket title updated successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin updateSupportTicketTitle ERROR", error);
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

    // Analytics
    getAnalytics = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit } = req.query as unknown as {
                page: string;
                limit: string;
            };
            const analytics = await this.superAdminService.getAnalytics(Number(page), Number(limit));
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(true, StatusCodes.OK, "Analytics fetched successfully", analytics)
                );
        } catch (error) {
            console.log("superAdmin getAnalytics ERROR", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error")
                );
        }
    }

    exportCsv = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        try {
            // await this.superAdminService.exportCsv(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Csv exported successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin exportCsv ERROR", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error")
                );
        }
    }
}

export const superAdminController = new SuperAdminController();
