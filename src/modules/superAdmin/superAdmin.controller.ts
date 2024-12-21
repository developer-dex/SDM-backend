import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { SuperAdminService } from "./superAdmin.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import {
    IChangeNotificationStatusRequest,
    ICreateAuditLogRequest,
    ICreateClientRequest,
    ICreateLicenseRequest,
    ICreateNotificationRequest,
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
                .status(400)
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
        const token_payload = req.token_payload;
        const {
            limit,
            page,
            searchParameter,
            isExportToEmail,
            recipientEmail,
            full_name,
            email,
            phoneNo,
            role,
            permissions,
            password,
            created_at,
        } = req.query as unknown as IGetAllUsersRequest;
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
                created_at,
                token_payload.data
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
                .status(400)
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
        const { id } = req.params;
        const token_payload = req.token_payload;
        try {
            await this.superAdminService.deleteUser(
                Number(id),
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
        } catch (error) {
            console.log("superAdmin deleteUser ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
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
                .status(400)
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
                .status(400)
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
                .status(400)
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
            cost,
            plan_name
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
                cost,
                plan_name
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
                .status(400)
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
            const alreadyExistInClientManagement = await this.superAdminService.alreadyExistInClientManagement(requestData.user_id);
            if(alreadyExistInClientManagement) {
                return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.BAD_REQUEST, "User already exist in client management"));
            }
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
                .status(400)
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
        } catch (error) {
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
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
                .status(400)
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
            const {
                page,
                limit,
                isExportToEmail,
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
                user_email,
                count
            } = req.query as unknown as {
                page: number;
                limit: number;
                isExportToEmail?: string;
                recipientEmail?: string;
                searchParameter?: string;
                issue_date?: string;
                expiry_date?: string;
                expiration_date?: string;
                license_key?: string;
                license_type?: string;
                status?: string;
                company_id?: string;
                company_name?: string;
                company_pan?: string;
                user_email?: string;
                count?: string;
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
                user_email,
                count,
                req.token_payload.data
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
                .status(400)
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
            await this.superAdminService.createLicense(requestData, req.token_payload.data);
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
                .status(400)
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
            await this.superAdminService.deleteLicense(licenseId, req.token_payload.data);
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
            console.log("superAdmin deleteLicense ERROR", error);
            return res
                .status(400)
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
            await this.superAdminService.updateLicense(requestData, req.token_payload.data);
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
            console.log("update license:::", error);
            return res
                .status(400)
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
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getAllCustomersExistInClientManagement = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        // const { limit, page } = req.query as unknown as IGetAllUsersRequest;
        try {
            const customers = await this.superAdminService.getAllCustomersExistInClientManagement();
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
                .status(400)
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
                .status(400)
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
            const {
                page,
                limit,
                isExportToEmail,
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
                end_to,
            } = req.query as unknown as {
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
                end_to,
                req.token_payload.data
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
                .status(400)
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
                .status(400)
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
                .status(400)
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
                .status(400)
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
                .status(400)
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
                .status(400)
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
    getAnalyticsTable = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit } = req.query as unknown as {
                page: string;
                limit: string;
            };
            const analytics = await this.superAdminService.getAnalytics(
                Number(page),
                Number(limit),
                req.query.companyId as string,
                req.query.companyName as string,
                req.query.planType as string,
                req.query.planActivation as string,
                req.query.revenueType as string,
                req.query.totalRevenue as string,
                req.query.startDate as string,
                req.query.endDate as string,
                req.query.rate as string
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Analytics fetched successfully",
                        analytics
                    )
                );
        } catch (error) {
            console.log("superAdmin getAnalytics ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getAnalyticsCard = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
       
        try {
            const analyticsCard = await this.superAdminService.getAnalyticsCard();
            return res
                .status(200)
            .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Analytics card fetched successfully",
                        analyticsCard
                    )
                );
        } catch (error) {
            console.log("superAdmin getAnalyticsCard ERROR", error);
            return res
                .status(400)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getWebsiteAnalytics = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { page, limit } = req.query as unknown as {
            page: number;
            limit: number;
        };
        try {
            const websiteAnalytics = await this.superAdminService.getWebsiteAnalytics(page, limit);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(true, StatusCodes.OK, "Website analytics fetched successfully", websiteAnalytics)
                );
        } catch (error) {
            console.log("superAdmin getWebsiteAnalytics ERROR", error);
            return res
                .status(400)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    // Notification
    createNotification = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData: ICreateNotificationRequest = req.body;
        try {
            await this.superAdminService.createNotification(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Notification created successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin createNotification ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getNotification = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { notificationId } = req.params;
        try {
            const notification = await this.superAdminService.getNotifications(
                Number(notificationId)
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Notification fetched successfully",
                        notification
                    )
                );
        } catch (error) {
            console.log("superAdmin getNotification ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    deleteNotification = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { notificationId } = req.params;
        try {
            await this.superAdminService.deleteNotification(Number(notificationId));
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(true, StatusCodes.OK, "Notification deleted successfully")
                );
        } catch (error) {
            console.log("superAdmin deleteNotification ERROR", error);
            return res
                .status(400)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    sendNotification = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        try {
            await this.superAdminService.sendNotification(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(true, StatusCodes.OK, "Notification sent successfully")
                );
        } catch (error) {
            console.log("superAdmin sendNotification ERROR", error);
            return res
                .status(400)
                .send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getNotificationList = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit } = req.query as unknown as {
                page: number;
                limit: number;
            };
            const notificationList =
                await this.superAdminService.getNotificationList(
                    Number(page),
                    Number(limit)
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Notification list fetched successfully",
                        notificationList
                    )
                );
        } catch (error) {
            console.log("superAdmin getNotificationList ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

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
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    // FAQ
    getFaq = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const faq = await this.superAdminService.getFaq();
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "FAQ fetched successfully",
                        faq
                    )
                );
        } catch (error) {
            console.log("superAdmin getFaq ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    createFaq = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        try {
            await this.superAdminService.createFaq(requestData.question, requestData.answer);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "FAQ created successfully"
                    )
                );
        } catch (error) {
            console.log("superAdmin createFaq ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    }

    updateFaq = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        try {
            await this.superAdminService.updateFaq(requestData);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(true, StatusCodes.OK, "FAQ updated successfully")
                );
        } catch (error) {
            console.log("superAdmin updateFaq ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error")
                );
        }
    }

    deleteFaq = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { faqId } = req.params;
        try {
            await this.superAdminService.deleteFaq(Number(faqId));
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(true, StatusCodes.OK, "FAQ deleted successfully")
                );
        } catch (error) {
            console.log("superAdmin deleteFaq ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error")
                );
        }
    }

    // Client Dashboard
    getClientDashboard = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { DBName, userId } = req.body as unknown as {
            DBName: string;
            userId: number;
        };
        try {
            const result = await this.superAdminService.getClientDashboard(DBName, userId);
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Client dashboard fetched successfully", result));
        } catch (error) {
            console.log("superAdmin getClientDashboard ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    // Admin Profile
    updateAdminProfile = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const tokenPayload = req.token_payload;
        const bannerImage = req.file;
        console.log("bannerImage:::", bannerImage);
        try {
            const data = await this.superAdminService.updateAdminProfile(tokenPayload.data.id, bannerImage);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Admin profile updated successfully",
                        data
                    )
                );
        } catch (error) {
            console.log("superAdmin updateAdminProfile ERROR", error);
            return res
                .status(400)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    // Contact Us listing
    getContactUs = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { page, limit, name, phoneNo, email, subject, message, createdAt } = req.query as unknown as {   
                page: number;
                limit: number;
                name?: string;
                phoneNo?: string;
                email?: string;
                subject?: string;
                message?: string;
                createdAt?: string;
            };
            const contactUs = await this.superAdminService.getContactUs(page, limit, name, phoneNo, email, subject, message, createdAt);
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Contact Us fetched successfully", contactUs));
        } catch (error) {
            console.log("superAdmin getContactUs ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    // Signup user listing
    getSignupUsers = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { page, limit, full_name, email, password } = req.query as unknown as {
            page: number;
            limit: number;
            full_name?: string;
            email?: string;
            password?: string;
        };
        try {
            const signupUsers = await this.superAdminService.getSignupUsers(page, limit, full_name, email, password);
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Signup users fetched successfully", signupUsers));
        } catch (error) {
            console.log("superAdmin getSignupUsers ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    // Testimonial Module
    getTestimonial = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { page, limit } = req.query as unknown as {
            page?: string;
            limit?: string;
        };
        try {
            const testimonial = await this.superAdminService.getTestimonial(Number(page), Number(limit));
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Testimonial fetched successfully", testimonial));
        } catch (error) {
            console.log("superAdmin getTestimonial ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    createTestimonial = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        const image = req.file;
        try {
            await this.superAdminService.addTestimonial(requestData, image);
            return res.status(200).send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Testimonial created successfully"));
        } catch (error) {
            console.log("superAdmin createTestimonial ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    deleteTestimonial = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { testimonialId } = req.params;
        try {
            await this.superAdminService.deleteTestimonial(Number(testimonialId));
            return res.status(200).send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Testimonial deleted successfully"));
        } catch (error) {
            console.log("superAdmin deleteTestimonial ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    // Integration images
    createIntegrationImages = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const image = req.file;
        try {
            await this.superAdminService.addIntegrationImages(image);
            return res.status(200).send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Integration images created successfully"));
        } catch (error) {
            console.log("superAdmin createIntegrationImages ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getIntegrationImages = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const integrationImages = await this.superAdminService.getIntegrationImages();
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Integration images fetched successfully", integrationImages));
        } catch (error) {
            console.log("superAdmin getIntegrationImages ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    deleteIntegrationImages = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { integrationImageId } = req.params;
        try {
            await this.superAdminService.deleteIntegrationImages(Number(integrationImageId));
            return res.status(200).send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Integration image deleted successfully"));
        } catch (error) {
            console.log("superAdmin deleteIntegrationImages ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getFeedbackAndSuggestion = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const { page, limit, Username, Email, Subject, Type, Message, CreatedAt } = req.query as unknown as {
            page: number;
            limit: number;
            Username?: string;
            Email?: string;
            Subject?: string;
            Type?: string;
            Message?: string;
            CreatedAt?: string;
        };
        try {
            const feedbackAndSuggestion = await this.superAdminService.getFeedbackAndSuggestion(page, limit, Username, Email, Subject, Type, Message, CreatedAt);
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Feedback and suggestion fetched successfully", feedbackAndSuggestion));
        } catch (error) {
            console.log("superAdmin getFeedbackAndSuggestion ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    getAdminEmailConfigration = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const adminEmailConfigration = await this.superAdminService.getAdminEmailConfigration();
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Admin email configration fetched successfully", adminEmailConfigration));
        } catch (error) {
            console.log("superAdmin getAdminEmailConfigration ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }

    updateAdminEmailConfigration = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        try {
            await this.superAdminService.updateAdminEmailConfigration(requestData);
            return res.status(200).send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Admin email configration updated successfully"));
        } catch (error) {
            console.log("superAdmin updateAdminEmailConfigration ERROR", error);
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }
}

export const superAdminController = new SuperAdminController();
