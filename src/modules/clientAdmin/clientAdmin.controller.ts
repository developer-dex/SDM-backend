import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { ClientAdminService } from "./clientAdmin.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { paginationRequeset } from "./clientAdmin.interface";
import { SuperAdminService } from "../superAdmin/superAdmin.service";

export class ClientAdminController {
    private responseService: ResponseService;
    private clientAdminService: ClientAdminService;
    private superAdminService: SuperAdminService;
    constructor() {
        this.responseService = new ResponseService();
        this.superAdminService = new SuperAdminService();
        this.clientAdminService = new ClientAdminService();
    }

    loginInternal = async (req: Request, res: Response) => {
        try {
            const result = await this.clientAdminService.loginInternal(
                req.body
            );
            if (!result) {
                return res
                    .status(StatusCodes.OK)
                    .send(
                        this.responseService.responseWithoutData(
                            false,
                            StatusCodes.OK,
                            "Dashboard not found. Please contact admin."
                        )
                    );
            }
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Internal login successful",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::loginInternal:::", error);
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

    getClientOnlineStatus = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.getSoftwareStatus(
                tokenPayload?.data.databaseName
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Client online status fetched successfully",
                        result
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

    getClientManagement = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        console.log("tokenPayload:::", tokenPayload);
        const { page, limit, ClientId, Name, JobGroup, IpMachineName, FolderName, UserName, Password, Quota, QuotaUnit, Description, EntryTime, Remarks, searchParameter} = req.query;
        try {
            console.log("tokenPayload?.data.databaseName:::", tokenPayload?.data);
            const result = await this.clientAdminService.getClientManagement(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                Number(ClientId),
                Name as string,
                JobGroup as string,
                IpMachineName as string,
                FolderName as string,
                UserName as string,
                Password as string,
                Number(Quota) as number,
                QuotaUnit as string,
                Description as string,
                EntryTime as string,
                Remarks as string,
                searchParameter as string
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Client management fetched successfully",
                        result
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

    getBackupSS = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const {
                limit,
                page,
                searchParameter,
                jobName,
                ClientFolderName,
                ClientData,
                BaseFolderName,
                BaseFolderData,
                Difference,
                Status,
                EntryDateTime,
            } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getBackupSS(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                jobName,
                ClientFolderName,
                ClientData,
                BaseFolderName,
                BaseFolderData,
                Difference,
                Status,
                EntryDateTime,
                searchParameter
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
            console.log("clientAdminController:::backupSS:::", error);
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
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Backup ss counts fetched successfully",
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

    getPingAndpath = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const {
                limit,
                page,
                searchParameter,
                jobName,
                ipMachine,
                sharedPath,
                pingStatus,
                connection,
                errors,
                entryDateTime,
            } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getPingAndPath(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                searchParameter,
                jobName,
                ipMachine,
                sharedPath,
                pingStatus,
                connection,
                errors,
                entryDateTime
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
            console.log("clientAdminController:::getPingAndpath:::", error);
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
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Ping and path counts fetched successfully",
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

    getAuditTrailLog = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const {
                limit,
                page,
                searchParameter,
                Username,
                UserRole,
                JobName,
                Module,
                Action,
                DateTimeStamp,
                LoginTime,
                LogoutTime,
            } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getAuditTrailLog(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                searchParameter,
                Username,
                UserRole,
                JobName,
                Module,
                Action,
                DateTimeStamp,
                LoginTime,
                LogoutTime
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
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    getJobFireStatistics = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const {
                limit,
                page,
                searchParameter,
                jobName,
                jobGroup,
                sourceIp,
                sourceFolder,
                destinationFolder,
                status,
                startTime,
                endTime,
                duration,
                nextRunDateTime,
                jobType,
                dataInKB,
                dataInMB,
                dataInGB,
                dataInTB,
            } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getJobFireStatistics(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                searchParameter,
                jobName,
                jobGroup,
                sourceIp,
                sourceFolder,
                destinationFolder,
                status,
                startTime,
                endTime,
                duration,
                nextRunDateTime,
                jobType,
                dataInKB,
                dataInMB,
                dataInGB,
                dataInTB
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Job fire statistics fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::jobFireStatistics:::", error);
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

    // User management
    getUsersList = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const {
                limit,
                page,
                searchParameter,
                username,
                email,
                role,
                phone,
                entryDate,
                moduleNames,
                password,
            } = req.query as unknown as paginationRequeset;
            const result = await this.clientAdminService.getUsersList(
                tokenPayload?.data.databaseName,
                Number(page),
                Number(limit),
                searchParameter,
                username,
                email,
                role,
                phone,
                entryDate,
                moduleNames,
                password
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Users list fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getUsersList:::", error);
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

    // Setting
    getSetting = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const result = await this.clientAdminService.getSetting(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Setting fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getSetting:::", error);
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

    // Dashboard
    getDashboard = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const result = await this.clientAdminService.getDashboard(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Dashboard fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getDashboard:::", error);
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

    getRepostFromDashboard = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const { reportType, from_date, to_date } = req.body;
            const result = await this.clientAdminService.getRepostFromDashboard(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id,
                reportType,
                from_date,
                to_date
            );
            return res
                .status(StatusCodes.OK)
                .send(
                    this.responseService.responseWithData(
                        false,
                        StatusCodes.OK,
                        "Dashboard report fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::getRepostFromDashboard:::",
                error
            );
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

    // Support Ticket Management
    // support ticket management
    getAllSupportTicketTitles = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const supportTicketTitles =
                await this.superAdminService.getAllSupportTicketTitles();
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

    getSoftwareStatus = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.getSoftwareStatus(
                tokenPayload?.data.databaseName
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Software status fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getSoftwareStatus:::", error);
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

    // Notification
    getNotification = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.getMyNotifications(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Notification fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getNotification:::", error);
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

    markAllRead = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.markAllRead(
                tokenPayload?.data.id
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "All notifications marked as read",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::markAllRead:::", error);
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

    getFaq = async (req: Request & { token_payload?: any }, res: Response) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.getFaq();
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "FAQ fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getFaq:::", error);
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

    // Pkan listing
    getPlanListing = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.getPlanListing(
                tokenPayload?.data.id
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Plan listing fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getPlanListing:::", error);
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

    //Email configuration
    getEmailConfiguration = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        try {
            const tokenPayload = req.token_payload;
            const result = await this.clientAdminService.getEmailConfiguration(
                tokenPayload?.data.id
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Email configuration fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::getEmailConfiguration:::",
                error
            );
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

    updateEmailConfiguration = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        try {
            const result =
                await this.clientAdminService.updateEmailConfiguration(
                    tokenPayload?.data.databaseName,
                    tokenPayload?.data.id,
                    req.body
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Email configuration updated successfully",
                        result
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::updateEmailConfiguration:::",
                error
            );
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

    createEmailSchedule = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        console.log("tokenPayload__________", tokenPayload);
        try {
            await this.clientAdminService.createEmailSchedule(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id,
                req.body
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Email schedule created successfully"
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::createEmailSchedule:::",
                error
            );
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

    updateEmailSchedule = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        console.log("tokenPayload__________", tokenPayload);
        try {
            await this.clientAdminService.updateEmailSchedule(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id,
                req.body
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Email schedule updated successfully"
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::updateEmailSchedule:::",
                error
            );
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

    deleteEmailSchedule = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        const { id } = req.params;
        try {
            await this.clientAdminService.deleteEmailSchedule(Number(id));
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        true,
                        StatusCodes.OK,
                        "Email schedule deleted successfully"
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::deleteEmailSchedule:::",
                error
            );
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

    getEmailSchedule = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        const { page, limit } = req.query as unknown as paginationRequeset;
        try {
            const result = await this.clientAdminService.getEmailSchedule(
                Number(page),
                Number(limit),
                tokenPayload?.data.id
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Email schedule fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log("clientAdminController:::getEmailSchedule:::", error);
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

    sendEmail = async (req: Request & { token_payload?: any }, res: Response) => {
        const tokenPayload = req.token_payload;
        const { id } = req.body
        console.log("tokenPayload", tokenPayload);
        try {
            await this.clientAdminService.sendEmail(Number(id), tokenPayload?.data.id, tokenPayload?.data.databaseName);
        return res
            .status(200)
            .send(this.responseService.responseWithoutData(true, StatusCodes.OK, "Email sent successfully"));
        } catch (error) {
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
        
    }

    createFeedbackAndSuggestion = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        const file = req.file;
        try {
            await this.clientAdminService.createFeedbackAndSuggestion(
                tokenPayload?.data.databaseName,
                tokenPayload?.data.id,
                req.body,
                file
            );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.OK,
                        "Feedback and suggestion created successfully"
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::createFeedbackAndSuggestion:::",
                error
            );
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

    getFeedbackAndSuggestion = async (
        req: Request & { token_payload?: any },
        res: Response
    ) => {
        const tokenPayload = req.token_payload;
        const { page, limit } = req.query as unknown as paginationRequeset;
        try {
            const result =
                await this.clientAdminService.getFeedbackAndSuggestion(
                    Number(page),
                    Number(limit),
                    tokenPayload?.data.id
                );
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Feedback and suggestion fetched successfully",
                        result
                    )
                );
        } catch (error) {
            console.log(
                "clientAdminController:::getFeedbackAndSuggestion:::",
                error
            );
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

    getNotificationCount = async (req: Request & { token_payload?: any }, res: Response) => {
        const tokenPayload = req.token_payload;
        try {
            const result = await this.clientAdminService.getNotificationCount(tokenPayload?.data.id);
            return res.status(200).send(this.responseService.responseWithData(true, StatusCodes.OK, "Notification count fetched successfully", result));
        } catch (error) {
            return res.status(400).send(this.responseService.responseWithoutData(false, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    }
}

export const clientAdminController = new ClientAdminController();
