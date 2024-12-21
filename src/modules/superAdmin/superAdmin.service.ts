import { createAuditTrail } from "../../common/function";
import { StatusCodes } from "../../common/responseStatusEnum";
import {
    executeQuery,
    executeQuery2,
    initializeDatabasePool,
    retrieveData,
} from "../../config/databaseConfig";
import { Actions, Modules } from "../../helpers/constants";
import { JwtService } from "../../helpers/jwt.service";
import { ResponseService } from "../../helpers/response.service";
import getEnvVar, {
    calculatePagination,
    createCsvFile,
    formateFrontImagePath,
    generateLicenseKey,
} from "../../helpers/util";
import {
    IChangeNotificationStatusRequest,
    ICreateAuditLogRequest,
    ICreateClientRequest,
    ICreateLicenseRequest,
    ICreateNotificationRequest,
    ISignInRequest,
    IUserRequest,
} from "./superAdmin.interface";
import { createObjectCsvWriter } from "csv-writer";
import nodemailer from "nodemailer";
import fs from "fs";
import sendMail from "../../helpers/sendMail";
import sendCsvToMail from "../../helpers/sendMail";
import moment from "moment";
export class SuperAdminService {
    private jwtService: JwtService;
    private responseService: ResponseService;

    constructor() {
        this.responseService = new ResponseService();
        this.jwtService = new JwtService();
    }

    // Signin
    signIn = async (requestData: ISignInRequest) => {
        const { email, password } = requestData;
        const query = `SELECT * FROM Admin WHERE email = '${email}' AND password = '${password}'`;
        const result = await executeQuery(query);
        if (result.rows.length === 0) {
            return [];
        }
        const responseData = this.generateLogInSignUpResponse(
            result.rows[0].id,
            result.rows[0].full_name,
            result.rows[0].role
        );

        let profilePhoto = result.rows[0].profilePhoto ? formateFrontImagePath(result.rows[0].profilePhoto) : null;
        

        const data = {
            id: result.rows[0].id,
            username: result.rows[0].full_name,
            loginTime: new Date().toISOString(),
            role: result.rows[0].role,
            module: Modules.ADMIN_DASHBOARD,
            action: Actions.ADMIN_DASHBOARD.LOGIN,
        };
        await createAuditTrail(data);
        return {
            ...result.rows[0],
            profilePhoto: `${getEnvVar("LOCAL_URL")}/assets${profilePhoto}`,
            ...responseData,
            role: result.rows[0].role,
        };
    };

    getAllUsers = async (
        page?: number,
        limit?: number,
        searchParameter?: string,
        isExportToEmail?: boolean,
        recipientEmail?: string,
        full_name?: string,
        email?: string,
        phoneNo?: string,
        role?: string,
        permissions?: string,
        password?: string,
        created_at?: string,
        token_payload?: any
    ) => {
        // Count total number of clients
        const totalCountQuery = `SELECT COUNT(*) as count FROM Admin`;

        // Pagination
        const { offset, limit: limitData } = calculatePagination(page, limit);

        let query = `SELECT * FROM Admin`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`full_name LIKE '%${searchParameter}%'`);
            searchFilters.push(`email LIKE '%${searchParameter}%'`);
            searchFilters.push(`phoneNo LIKE '%${searchParameter}%'`);
            searchFilters.push(`role LIKE '%${searchParameter}%'`);
            searchFilters.push(`permissions LIKE '%${searchParameter}%'`);
            searchFilters.push(`created_at LIKE '%${searchParameter}%'`);
        }

        if (full_name) {
            filters.push(`full_name LIKE '%${full_name}%'`);
        }
        if (email) {
            filters.push(`email LIKE '%${email}%'`);
        }
        if (phoneNo) {
            filters.push(`phoneNo LIKE '%${phoneNo}%'`);
        }
        if (role) {
            filters.push(`role LIKE '%${role}%'`);
        }
        if (permissions) {
            filters.push(`permissions LIKE '%${permissions}%'`);
        }
        if (password) {
            filters.push(`password LIKE '%${password}%'`);
        }
        if (created_at) {
            filters.push(this.getDateCondition(created_at, "created_at"));
        }
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }
        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (limit && page) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        const adminsResult = await executeQuery(query);
        const totalCountResult = await executeQuery(totalCountQuery);
        const admins = adminsResult.rows;

        if (isExportToEmail) {
            const header = [
                { id: "id", title: "User Id" },
                { id: "full_name", title: "Username" },
                { id: "role", title: "User role" },
                { id: "password", title: "Password" },
                { id: "email", title: "Email" },
                { id: "phoneNo", title: "Phone No" },
                { id: "created_at", title: "Entry Date Time" },
                { id: "permissions", title: "Modules" },
            ];
            const path = await createCsvFile(admins, header);
            await sendCsvToMail(
                recipientEmail,
                "Users CSV",
                "Please find the attached CSV file of users.",
                path,
                "users.csv"
            );
            const data = {
                id: token_payload?.id,
                username: token_payload?.username,
                loginTime: new Date().toISOString(),
                role: token_payload?.role,
                module: Modules.USER_MANAGEMENT,
                action: Actions.USER_MANAGEMENT.EXPORT_TO_EMAIL,
            };
            await createAuditTrail(data);
        }

        return {
            admins,
            totalCount: totalCountResult.rows[0].count,
        };
    };

    deleteUser = async (clientId: number, token_payload: any) => {
        const query = `DELETE FROM Admin WHERE id = '${clientId}'`;
        const clients = await executeQuery(query);
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: new Date().toISOString(),
            role: token_payload.role,
            module: Modules.USER_MANAGEMENT,
            action: Actions.USER_MANAGEMENT.DELETE,
        };
        await createAuditTrail(data);
        return clients;
    };

    updateUser = async (requestData: IUserRequest, token_payload: any) => {
        const {
            full_name,
            email,
            password,
            role,
            permissions,
            phoneNo,
            user_id,
        } = requestData;
        const query = `UPDATE Admin SET full_name = '${full_name}', email = '${email}', password = '${password}', role = '${role}', permissions = '${permissions}', phoneNo = '${phoneNo}' WHERE id = '${user_id}'`;

        console.log("query:::", query);

        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: new Date().toISOString(),
            role: token_payload.role,
            module: Modules.USER_MANAGEMENT,
            action: Actions.USER_MANAGEMENT.UPDATE,
        };
        await createAuditTrail(data);
        return await executeQuery(query);
    };

    addClient = async (requestData: any, token_payload: any) => {
        const { full_name, email, password, role, permissions, phoneNo } =
            requestData;
        const query = `INSERT INTO Admin (full_name, email, password, role, permissions, phoneNo) VALUES ('${full_name}', '${email}', '${password}', '${role}', '${permissions}', '${phoneNo}')`;
        const data = {
            id: token_payload.id,
            username: token_payload.username,
            loginTime: new Date().toISOString(),
            role: token_payload.role,
            module: Modules.USER_MANAGEMENT,
            action: Actions.USER_MANAGEMENT.CREATE,
        };
        await createAuditTrail(data);
        return await executeQuery(query);
    };

    changeNotificationStatus = async (
        requestData: IChangeNotificationStatusRequest
    ) => {
        const { notificationId, status } = requestData;
        const query = `UPDATE Notifications SET status = ${status} WHERE id = ${notificationId}`;
        return await executeQuery(query);
    };

    // Client Management

    getAllClients = async (
        limit?: number,
        page?: number,
        searchParameter?: string,
        company_name?: string,
        company_address?: string,
        start_date?: string,
        end_date?: string,
        payment_method?: string,
        status?: string,
        isExportToEmail?: boolean,
        recipientEmail?: string,
        gst?: string,
        pan?: string,
        industry_type?: string,
        cost?: string,
        plan_name?: string
    ) => {
        let query = `SELECT cm.company_name, cm.id, p.plan_name, p.id as plan_id, cm.company_address, cm.gst, cm.pan, cm.industry_type, cm.company_id, cm.plan_type, cm.cost, cm.status, cm.payment_method,cm.created_at, u.email, u.id as user_id, u.databaseName  FROM ClientManagement cm LEFT JOIN Users u ON cm.user_id = u.id LEFT JOIN Plans p ON p.id = cm.plan_id`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`cm.company_name LIKE '%${searchParameter}%'`);
            searchFilters.push(
                `cm.company_address LIKE '%${searchParameter}%'`
            );
            searchFilters.push(`cm.gst LIKE '%${searchParameter}%'`);
            searchFilters.push(`cm.pan LIKE '%${searchParameter}%'`);
            searchFilters.push(`cm.industry_type LIKE '%${searchParameter}%'`);
            searchFilters.push(`cm.company_id LIKE '%${searchParameter}%'`);
            searchFilters.push(`cm.cost LIKE '%${searchParameter}%'`);
            searchFilters.push(`cm.payment_method LIKE '%${searchParameter}%'`);
            searchFilters.push(`cm.status LIKE '%${searchParameter}%'`)
            searchFilters.push(`p.plan_name LIKE '%${searchParameter}%'`)
        }
        if (company_name) {
            filters.push(`cm.company_name LIKE '%${company_name}%'`);
        }
        if (company_address) {
            filters.push(`cm.company_address LIKE '%${company_address}%'`);
        }
        if (start_date) {
            filters.push(this.getDateCondition(start_date, "created_at"));
        }
        if (end_date) {
            filters.push(this.getDateCondition(end_date, "created_at"));
        }
        if (payment_method) {
            filters.push(`cm.payment_method = '${payment_method}'`);
        }
        if (status) {
            filters.push(`cm.status = '${status}'`);
        }
        if (plan_name) {
            filters.push(`p.plan_name = '${plan_name}'`);
        }
        if (gst) {
            filters.push(`cm.gst = '${gst}'`);
        }
        if (pan) {
            filters.push(`cm.pan = '${pan}'`);
        }
        if (industry_type) {
            filters.push(`cm.industry_type = '${industry_type}'`);
        }
        if (cost) {
            filters.push(`cm.cost = '${cost}'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }
        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
        }
        const { offset, limit: limitData } = calculatePagination(page, limit);
        if (limit && page) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("CLIENT______________", query);
        const data = await executeQuery(query);

        // total count of client
        const totalCountQuery = `SELECT COUNT(*) as count FROM ClientManagement`;
        const totalCountData = await executeQuery(totalCountQuery);

        if (isExportToEmail) {
            const header = [
                { id: "ID", title: "ID" },
                { id: "company_name", title: "Company Name" },
                { id: "company_address", title: "Company Address" },
                { id: "gst", title: "GST" },
                { id: "pan", title: "PAN" },
                { id: "industry_type", title: "Industry Type" },
                { id: "company_id", title: "Company ID" },
                { id: "plan_type", title: "Plan Type" },
                { id: "cost", title: "Cost" },
                { id: "status", title: "Status" },
                { id: "payment_method", title: "Payment Method" },
                { id: "created_at", title: "Created At" },
            ];
            const path = await createCsvFile(data.rows, header);
            await sendCsvToMail(
                recipientEmail,
                "Clients CSV",
                "Please find the attached CSV file of clients.",
                path,
                "clients.csv"
            );
        }
        return {
            clients: data.rows,
            totalCount: totalCountData.rows[0].count,
        };
    };

    createClient = async (requestData: ICreateClientRequest) => {
        const {
            company_name,
            company_address,
            payment_method,
            gst_number,
            pan_number,
            industry_type,
            company_id,
            status,
            plan_id,
            plan_type,
            cost,
            user_id,
        } = requestData;
        const query = `INSERT INTO ClientManagement (company_name, company_address, payment_method, gst, pan, industry_type, company_id, status, plan_type, cost, user_id, plan_id) VALUES ('${company_name}', '${company_address}', '${payment_method}', '${gst_number}', '${pan_number}', '${industry_type}', '${company_id}', '${status}', '${plan_type}', ${cost}, ${user_id}, ${plan_id})`;

        // Update the database name as company_id in user table
        const updateUserQuery = `UPDATE Users SET databaseName = '${company_id}' WHERE id = ${user_id}`;
        await executeQuery(updateUserQuery);
        return await executeQuery(query);
    }; 

    deleteClient = async (companyId: string) => {
        const query = `DELETE FROM ClientManagement WHERE company_id = '${companyId}'`;
        return await executeQuery(query);
    };

    updateClient = async (requestData: ICreateClientRequest) => {
        const {
            company_name,
            company_address,
            payment_method,
            gst_number,
            pan_number,
            industry_type,
            company_id,
            status,
            plan_type,
            id,
            cost,
            plan_id,
        } = requestData;
        const query = `UPDATE ClientManagement SET company_name = '${company_name}', company_id = '${company_id}', company_address = '${company_address}', payment_method = '${payment_method}', gst = '${gst_number}', pan = '${pan_number}', industry_type = '${industry_type}', status = '${status}', plan_type = '${plan_type}', cost = ${cost}, plan_id = ${plan_id} WHERE id = '${id}'`;

        // Find the existing client
        const findClientQuery = `SELECT * FROM ClientManagement WHERE id = '${id}'`;
        const client = await executeQuery(findClientQuery);
        const user_id = client.rows[0].user_id;

        // Update the database name as company_id in user table
        const updateUserQuery = `UPDATE Users SET databaseName = '${company_id}' WHERE id = ${user_id}`;
        await executeQuery(updateUserQuery);
        return await executeQuery(query);
    };

    // Licenses Management

    getAllLicenses = async (
        page: number,
        limit: number,
        isExportToEmail?: boolean,
        recipientEmail?: string,
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
        user_email?: string,
        count?: string,
        token_payload?: any
    ) => {
        let query = `SELECT l.issue_date, l.count, l.id as license_id, l.expiration_date, l.license_key, l.license_type, l.status, l.company_id, l.company_name, l.company_pan, u.email, u.id as user_id FROM Licenses l LEFT JOIN Users u on u.id = l.user_id`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`l.license_key LIKE '%${searchParameter}%'`);
            searchFilters.push(`l.license_type LIKE '%${searchParameter}%'`);
            searchFilters.push(`l.status LIKE '%${searchParameter}%'`);
            searchFilters.push(`l.company_id LIKE '%${searchParameter}%'`);
            searchFilters.push(`l.company_name LIKE '%${searchParameter}%'`);
            searchFilters.push(`l.company_pan LIKE '%${searchParameter}%'`);
            searchFilters.push(`u.email LIKE '%${searchParameter}%'`);
            searchFilters.push(`l.count LIKE '%${searchParameter}%'`);
        }

        if (issue_date) {
            filters.push(this.getDateCondition(issue_date, "issue_date"));
        }
        if (expiry_date) {
            filters.push(this.getDateCondition(expiry_date, "expiration_date"));
        }
        if (expiration_date) {
            filters.push(
                this.getDateCondition(expiration_date, "expiration_date")
            );
        }
        if (license_key) {
            filters.push(`l.license_key LIKE '%${license_key}%'`);
        }
        if (license_type) {
            filters.push(`l.license_type LIKE '%${license_type}%'`);
        }
        if (status) {
            filters.push(`l.status LIKE '%${status}%'`);
        }
        if (company_id) {
            filters.push(`l.company_id LIKE '%${company_id}%'`);
        }
        if (company_name) {
            filters.push(`l.company_name LIKE '%${company_name}%'`);
        }
        if (company_pan) {
            filters.push(`l.company_pan LIKE '%${company_pan}%'`);
        }
        if (user_email) {
            filters.push(`u.email LIKE '%${user_email}%'`);
        }
        if (count) {
            filters.push(`l.count = ${count}`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }
        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        const { offset, limit: limitData } = calculatePagination(page, limit);
        if (limit && page) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);
        const data = await executeQuery(query);

        // totalCount
        const totalCountQuery = `SELECT COUNT(*) as count FROM Licenses`;
        const totalCountData = await executeQuery(totalCountQuery);

        if (isExportToEmail) {
            const header = [
                { id: "ID", title: "ID" },
                { id: "issue_date", title: "Issue Date" },
                { id: "expiration_date", title: "Expiration Date" },
                { id: "license_key", title: "License Key" },
                { id: "license_type", title: "License Type" },
                { id: "status", title: "Status" },
                { id: "company_id", title: "Company ID" },
                { id: "company_name", title: "Company Name" },
                { id: "company_pan", title: "Company PAN" },
                { id: "count", title: "Count" },
            ];
            const path = await createCsvFile(data.rows, header);
            await sendCsvToMail(
                recipientEmail,
                "Licenses CSV",
                "Please find the attached CSV file of licenses.",
                path,
                "licenses.csv"
            );
            const auditData = {
                id: token_payload?.id,
                username: token_payload?.username,
                loginTime: new Date().toISOString(),
                role: token_payload?.role,
                module: Modules.LICENSE_MANAGEMENT,
                action: Actions.LICENSE_MANAGEMENT.EXPORT_TO_EMAIL,
            };
            await createAuditTrail(auditData);
        }
        return {
            licenses: data.rows,
            totalCount: totalCountData.rows[0].count,
        };
    };

    createLicense = async (requestData: ICreateLicenseRequest, token_payload: any) => {
        const findUserQuery = `SELECT cm.company_id, cm.company_name, cm.pan, cm.plan_type, p.plan_name, u.id FROM Users u 
        LEFT JOIN ClientManagement cm ON cm.user_id = u.id 
        LEFT JOIN Subscription s ON s.userId = u.id
        LEFT JOIN Plans p ON p.id = s.planId
        WHERE u.id = '${requestData.user_id}'`;
        const user = await executeQuery(findUserQuery);

        console.log("user:::", user.rows);
        if (user.rows.length === 0) {
            return this.responseService.responseWithoutData(
                false,
                StatusCodes.BAD_REQUEST,
                "User not found"
            );
        }
        const { issue_date, expiry_date, status, count } = requestData;

        console.log("user.rows[0].plan_type", user.rows[0].plan_type)

      if(!user.rows[0].plan_type){
        return this.responseService.responseWithoutData(
            false,
            StatusCodes.BAD_REQUEST,
            "User not subscribed to any plan"
        );
      }

        // Ensure that the required fields are defined
        if (!user.rows[0].id || !issue_date || !expiry_date) {
            throw new Error("Required fields are missing.");
        }

        const license_key = generateLicenseKey(
            user.rows[0].plan_type,
            user.rows[0].pan,
            issue_date,
            expiry_date,
            count
        );

        console.log("license_key:::", license_key);
        const query = `INSERT INTO Licenses (user_id, issue_date, expiration_date, license_key, license_type, status, company_id, company_name, company_pan, count) VALUES ('${user.rows[0].id}', '${issue_date}', '${expiry_date}', '${license_key}', '${user.rows[0].plan_type}', '${status}', '${user.rows[0].company_id}', '${user.rows[0].company_name}', '${user.rows[0].pan}', ${count})`;
        
        await executeQuery(query);
        const data = {
            id: token_payload?.id,
            username: token_payload?.username,
            loginTime: new Date().toISOString(),
            role: token_payload?.role,
            module: Modules.LICENSE_MANAGEMENT,
            action: Actions.LICENSE_MANAGEMENT.CREATE,
        };
        return createAuditTrail(data);
    };

    deleteLicense = async (licenseId: string, token_payload: any) => {
        const query = `DELETE FROM Licenses WHERE company_id = '${licenseId}'`;
        const data = {
            id: token_payload?.id,
            username: token_payload?.username,
            loginTime: new Date().toISOString(),
            role: token_payload?.role,
            module: Modules.LICENSE_MANAGEMENT,
            action: Actions.LICENSE_MANAGEMENT.DELETE,
        };
        await createAuditTrail(data);
        return await executeQuery(query);
    };

    updateLicense = async (requestData: ICreateLicenseRequest, token_payload: any) => {
        const findUserQuery = `SELECT cm.company_id, cm.company_name, cm.pan, cm.plan_type, p.plan_name FROM Users u 
        LEFT JOIN ClientManagement cm ON cm.user_id = u.id 
        LEFT JOIN Subscription s ON s.userId = u.id
        LEFT JOIN Plans p ON p.id = s.planId
        WHERE u.id = '${requestData.user_id}'`;

        console.log("findUserQuery", findUserQuery)
        const user = await executeQuery(findUserQuery);
        if (user.rows.length === 0) {
            return this.responseService.responseWithoutData(
                false,
                StatusCodes.BAD_REQUEST,
                "User not found"
            );
        }
        console.log("user[0]user[0]user[0]", user.rows[0].plan_type)
        const { license_id, issue_date, expiry_date, status, count } = requestData;
        const license_key = generateLicenseKey(
            user.rows[0].plan_type,
            user.rows[0].pan,
            issue_date,
            expiry_date,
            count
        );
        const query = `UPDATE Licenses SET license_key = '${license_key}', license_type = '${user.rows[0].plan_type}', issue_date = '${issue_date}', expiration_date = '${expiry_date}', status = '${status}', company_id = '${user.rows[0].company_id}', company_name = '${user.rows[0].company_name}', company_pan = '${user.rows[0].pan}', count = ${count} WHERE id = '${license_id}'`;
        await executeQuery(query);
        const data = {
            id: token_payload?.id,
            username: token_payload?.username,
            loginTime: new Date().toISOString(),
            role: token_payload?.role,
            module: Modules.LICENSE_MANAGEMENT,
            action: Actions.LICENSE_MANAGEMENT.UPDATE,
        };
        return createAuditTrail(data);
    };

    // Customer Management

    getAllCustomers = async () => {
        // const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM Users WHERE id IN (SELECT user_id FROM ClientManagement)`;
        // if(limit && page) {
        //     query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        // }
        const data = await executeQuery(query);
        return {
            customers: data.rows,
        };
    };

    getAllCustomersExistInClientManagement = async () => {
        // const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM Users WHERE id NOT IN (SELECT DISTINCT(user_id) FROM ClientManagement)`;
        // if(limit && page) {
        //     query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        // }
        const data = await executeQuery(query);
        return {
            customers: data.rows,
        };
    };

    alreadyExistInClientManagement = async (userId: string) => {
        const query = `SELECT * FROM ClientManagement WHERE user_id = '${userId}'`;
        const data = await executeQuery(query);
        return data.rows.length > 0;
    }

    // Audit Logs

    createAuditLog = async (
        requestData: ICreateAuditLogRequest,
        payloadData: any
    ) => {
        const { id, username, loginTime, role } = payloadData;
        console.log("requestData:::", requestData);
        console.log("user_id:::", id, username, loginTime, role);
        let logoutQueryAdd = "";
        if (requestData.action === "logout") {
            const currentTime = new Date().toISOString();
            logoutQueryAdd = `, logout_time = '${currentTime}'`;
        }
        const query = `INSERT INTO AuditTrail (module, action, user_id, username, login_time, role ${logoutQueryAdd}) VALUES ('${requestData.module}', '${requestData.action}', '${id}', '${username}', '${loginTime}', '${role}')`;
        return await executeQuery(query);
    };

    getAllAuditLogs = async (
        page: number,
        limit: number,
        isExportToEmail?: boolean,
        recipientEmail?: string,
        searchParameter?: string,
        createdAt?: string,
        username?: string,
        role?: string,
        module?: string,
        action?: string,
        loginTime?: string,
        logoutTime?: string,
        start_from?: string,
        end_to?: string,
        token_payload?: any
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM AuditTrail`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`module LIKE '%${searchParameter}%'`);
            searchFilters.push(`action LIKE '%${searchParameter}%'`);
            searchFilters.push(`username LIKE '%${searchParameter}%'`);
            searchFilters.push(`role LIKE '%${searchParameter}%'`);
            searchFilters.push(`login_time LIKE '%${searchParameter}%'`);
            searchFilters.push(`logout_time LIKE '%${searchParameter}%'`);
            searchFilters.push(`createdAt LIKE '%${searchParameter}%'`);
        }

        if (createdAt) {
            filters.push(
                this.getDateCondition(
                    createdAt,
                    "createdAt",
                    start_from,
                    end_to
                )
            );
        }
        if (username) {
            filters.push(`username LIKE '%${username}%'`);
        }
        if (role) {
            filters.push(`role LIKE '%${role}%'`);
        }
        if (module) {
            filters.push(`module LIKE '%${module}%'`);
        }
        if (action) {
            filters.push(`action LIKE '%${action}%'`);
        }
        if (loginTime) {
            filters.push(
                this.getDateCondition(
                    loginTime,
                    "login_time",
                    start_from,
                    end_to
                )
            );
        }
        if (logoutTime) {
            filters.push(
                this.getDateCondition(
                    logoutTime,
                    "logout_time",
                    start_from,
                    end_to
                )
            );
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (
            limit &&
            page
            // && (isExportToEmail && !isExportToEmail)
        ) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);

        const totalCountQuery = `SELECT COUNT(*) as count FROM AuditTrail`;
        const totalCountData = await executeQuery(totalCountQuery);
        const data = await executeQuery(query);

        if (isExportToEmail) {
            const header = [
                { id: "ID", title: "ID" },
                { id: "module", title: "Module" },
                { id: "action", title: "Action" },
                { id: "user_id", title: "User ID" },
                { id: "username", title: "Username" },
                { id: "login_time", title: "Login Time" },
                { id: "role", title: "Role" },
                { id: "logout_time", title: "Logout Time" },
                { id: "createdAt", title: "Created At" },
            ];
            const path = await createCsvFile(data.rows, header);
            await sendCsvToMail(
                recipientEmail,
                "Audit Logs CSV",
                "Please find the attached CSV file of audit logs.",
                path,
                "support_ticket_titles.csv"
            );
            const auditData = {
                id: token_payload?.id,
                username: token_payload?.username,
                loginTime: new Date().toISOString(),
                role: token_payload?.role,
                module: Modules.AUDIT_LOGS,
                action: Actions.AUDIT_TRAIL.EXPORT_TO_EMAIL,
            };
            await createAuditTrail(auditData);
        }
        return {
            auditLogs: data.rows,
            totalCount: totalCountData.rows[0].count,
        };
    };

    // Dashboard Temp
    dashboardDetails = async () => {
        // const query = `SELECT * FROM Users `;
        // const users = await executeQuery(query);

        // const NoDataInLast24Hours = [];
        // const DataInLast24Hours = [];


        // for (let i = 0; i < users.rows.length; i++) {
        //     const databaseName = users.rows[i].databaseName;
        //     const query = `SELECT 
        //         '${databaseName}' AS SchemaName,
        //         COUNT(*) AS RecordCount
        //     FROM ${databaseName}.dbo.PingPathLogs
        //     WHERE EntryDateTime >= DATEADD(HOUR, -24, GETDATE())`;
        //     const data = await executeQuery(query);

        //     // Check the count and push to the respective arrays
        //     if (data.rows[0].RecordCount === 0) {
        //         NoDataInLast24Hours.push(databaseName);
        //     } else {
        //         DataInLast24Hours.push(databaseName);
        //     }
        // }

        const userCountsQuery = `
            SELECT 
                COUNT(*) AS totalUsers,
                COUNT(CASE WHEN status = 'active' THEN 1 END) AS activeUsers,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) AS inactiveUsers
            FROM ClientManagement
        `;
        const userCountsData = await executeQuery(userCountsQuery);
        const totalUserInClientManagementCount = userCountsData.rows[0].totalUsers;
        const ActiveAndInactiveClientManagementUserCountCount = userCountsData.rows[0].activeUsers;
        const InactiveClientManagementUserCountCount = userCountsData.rows[0].inactiveUsers;

        const latestSupportTicketDataQuery = `SELECT 
    cm.company_name,
    st.Topic AS support_subject,
    st.createdAt AS date_time,
    st.status AS status
FROM 
    ClientManagement cm
JOIN 
    SupportTickets st ON cm.user_id = st.userId;`;

        const plansOverviewQuery = `SELECT 
    p.plan_name,
    p.plan_type,
    COUNT(sh.id) AS subscription_count,
    ROUND(COUNT(sh.id) * 100.0 / NULLIF(SUM(COUNT(sh.id)) OVER (), 0), 2) AS popularity_percentage
FROM 
    SubscriptionHistory sh
JOIN 
    Plans p ON sh.planId = p.id
GROUP BY 
    p.plan_name, p.plan_type
ORDER BY 
    subscription_count DESC`;

//     const licenseOverviewQuery = `SELECT 
//     COUNT(*) AS total_licenses,
//     COUNT(CASE WHEN status = 'Active' THEN 1 END) AS running_licenses,
//     COUNT(CASE WHEN status = 'Inactive' THEN 1 END) AS expired_licenses,
//     COUNT(CASE WHEN expiration_date >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0) 
//                 AND expiration_date < DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) + 1, 0) 
//                 THEN 1 END) AS licenses_expiring_this_month
// FROM 
//     Licenses`

const query2 = `
            WITH 
            SupportTicketCounts AS (
                SELECT 
                    COUNT(*) AS total_tickets,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_tickets,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_tickets,
                    ROUND((COUNT(CASE WHEN is_on_time = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2) AS response_on_time_percentage
                FROM SupportTickets
            ),
            LicenseCounts AS (
                SELECT 
                    COUNT(*) AS total_licenses,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) AS running_licenses,
                    COUNT(CASE WHEN status = 'Inactive' THEN 1 END) AS expired_licenses,
                    COUNT(CASE WHEN expiration_date >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0) 
                                AND expiration_date < DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) + 1, 0) 
                                THEN 1 END) AS licenses_expiring_this_month
                FROM Licenses
            )
            SELECT 
                (SELECT total_tickets FROM SupportTicketCounts) AS totalTickets,
                (SELECT open_tickets FROM SupportTicketCounts) AS openTickets,
                (SELECT closed_tickets FROM SupportTicketCounts) AS closedTickets,
                (SELECT response_on_time_percentage FROM SupportTicketCounts) AS responseOnTimePercentage,
                (SELECT total_licenses FROM LicenseCounts) AS totalLicenses,
                (SELECT running_licenses FROM LicenseCounts) AS runningLicenses,
                (SELECT expired_licenses FROM LicenseCounts) AS expiredLicenses,
                (SELECT licenses_expiring_this_month FROM LicenseCounts) AS licensesExpiringThisMonth;
        `;
        
        // const result = await executeQuery(query2);

        // const [latestSupportTicketData, plansOverviewData, result] = await Promise.all([
        //     executeQuery(latestSupportTicketDataQuery),
        //     executeQuery(plansOverviewQuery),
        //     executeQuery(query2)
        // ]);

        const latestSupportTicketData = await executeQuery(latestSupportTicketDataQuery);
        const plansOverviewData = await executeQuery(plansOverviewQuery);
        const result = await executeQuery(query2);
        


        // Return the counts in the final result
        return {
            onlineClients: ActiveAndInactiveClientManagementUserCountCount,
            offlineClients: InactiveClientManagementUserCountCount,
            totalUsers: totalUserInClientManagementCount,
            ticketAndLicenseData: result.rows,
            latestSupportTicketData: latestSupportTicketData.rows,
            plansOverviewData: plansOverviewData.rows,
        };
    };

    // Support Ticket Management

    getAllSupportTicketTitles = async (page?: number, limit?: number) => {
        let query = `SELECT * FROM SupportTicketTitles`;
        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        let totalCountQuery = `SELECT COUNT(*) as count FROM SupportTicketTitles`;
        const totalCountData = await executeQuery(totalCountQuery);
        const data = await executeQuery(query);
        return {
            supportTicketTitles: data.rows,
            totalCount: totalCountData.rows[0].count,
        };
    };

    addSupportTicketTitle = async (requestData: any) => {
        const query = `INSERT INTO SupportTicketTitles (title) VALUES ('${requestData.title}')`;
        return await executeQuery(query);
    };

    deleteSupportTicketTitle = async (titleId: number) => {
        const query = `DELETE FROM SupportTicketTitles WHERE id = '${titleId}'`;
        return await executeQuery(query);
    };

    updateSupportTicketTitle = async (requestData: any) => {
        const query = `UPDATE SupportTicketTitles SET title = '${requestData.title}' WHERE id = '${requestData.titleId}'`;
        return await executeQuery(query);
    };

    // Analytics
    getAnalytics = async (page: number, limit: number, companyId?: string, companyName?: string, planType?: string, planActivation?: string, revenueType?: string, totalRevenue?: string, startDate?: string, endDate?: string, rate?: string) => {
        
        // const revenueAndSubscriptionMatrices = await executeQuery(this.revenueAndSubscriptionMatricesQuery());
        const {totalCountQuery, query} = await this.listOfClientsQuery(page, limit, companyId, companyName, planType, planActivation, revenueType, totalRevenue, startDate, endDate, rate);
        const listOfClients = await executeQuery(query);
        const totalCount = await executeQuery(totalCountQuery);
        return { listOfClients: listOfClients.rows, totalCount: totalCount.rows.length};
    }

    getAnalyticsCard = async () => {
        const revenueAndSubscriptionMatrices = await executeQuery(this.revenueAndSubscriptionMatricesQuery());
        return {revenueAndSubscriptionMatrices: revenueAndSubscriptionMatrices.rows}
    }

    getWebsiteAnalytics = async (page: number, limit: number) => {

        // Total Count
        const totalCountQuery = `SELECT COUNT(*) FROM Analytics`;
        const totalCountData = await executeQuery(totalCountQuery);
        const totalCount = totalCountData.rows[0][''];

        const websiteAnalytics = await executeQuery(this.websiteAnalyticsQuery(page, limit));
        return {websiteAnalytics: websiteAnalytics.rows, totalCount: totalCount};
    }

    checkClientIsAccessable = async (id: number) => {
        const query = `SELECT * FROM Client where id = '${id}'`;
        const clients = await retrieveData(query);
        return clients.rows;
    };

    // exportCsv = async (requestData: any) => {
    //     const { email } = requestData;
    //     const query = `SELECT * FROM SupportTicketTitles`;
    //     const data = await executeQuery(query);

    //     // Call the function to send CSV via email
    //     await this.sendCsvEmail(data.rows, email);
    //     return data.rows;
    // }

    isExistClient = async (whereCondition: string) => {
        const query = `SELECT * FROM Admin WHERE ${whereCondition}`;
        const clients = await retrieveData(query);
        return clients.rows;
    };

    getDatabyConnection = async (query: string) => {
        const data = await executeQuery(query);
        return data.rows;
    };


    // Notification
    createNotification = async (requestData: ICreateNotificationRequest) => {
        console.log("requestData:::", requestData);
        const createNotification = `INSERT INTO Notifications (Title, MessageBody, NotificationType, ExpirationDate, DeliverySettings) VALUES ('${requestData.title}', '${requestData.message}', '${requestData.type}', '${requestData.expiry_date}', 'instant')`;
        console.log("createNotification:::", createNotification);
        const notification = await executeQuery(createNotification);

        // extract last notification id
        const latestNotificationIdQuery = `SELECT MAX(id) FROM Notifications`;
        const latestNotificationId = await executeQuery(latestNotificationIdQuery);
        const notificationId = latestNotificationId.rows[0]['']; // Access the value using the empty string key

        console.log("latestNotificationId:::", latestNotificationId);

             // Assuming requestData.user_ids is an array of user IDs
             const userIds = requestData.user_ids.map(userId => `(${notificationId}, ${userId})`).join(", "); // Create a string of tuples
             console.log("userIds:::", userIds);
             const createNotificationLinedUsers = `INSERT INTO NotificationLinkedUsers (NotificationId, UserId) VALUES ${userIds}`;
             console.log("createNotificationLinedUsers:::", createNotificationLinedUsers);
        await executeQuery(createNotificationLinedUsers);
    }

    getNotifications = async (notificationId: number) => {
        console.log("getNotifications:::");
        const query = `SELECT 
    Notifications.id AS NotificationId, 
    Notifications.Title, 
    Notifications.MessageBody, 
    Notifications.NotificationType, 
    Notifications.ExpirationDate, 
    Notifications.DeliverySettings, 
    Users.id AS UserId, 
    Users.full_name AS username, 
    Users.email
FROM 
    Notifications 
LEFT JOIN 
    NotificationLinkedUsers ON Notifications.id = NotificationLinkedUsers.NotificationId 
LEFT JOIN 
    Users ON NotificationLinkedUsers.UserId = Users.id 
WHERE 
    Notifications.id = '${notificationId}' AND Notifications.deletedAt is null`;
        
        const results = await executeQuery(query); // Assume this gets the flat result set
        const notificationsMap = {};
        
        results.rows.forEach(row => {
            const { NotificationId, Title, MessageBody, NotificationType, ExpirationDate, DeliverySettings, UserId, username, email, full_name, role } = row;
        
            if (!notificationsMap[NotificationId]) {
                notificationsMap[NotificationId] = {
                    NotificationId,
                    Title,
                    MessageBody,
                    NotificationType,
                    ExpirationDate,
                    DeliverySettings,
                    userData: []
                };
            }
        
            if (UserId) {
                notificationsMap[NotificationId].userData.push({
                    id: UserId,
                    username,
                    email
                });
            }
        });
        return {data: Object.values(notificationsMap)};
    };

    getNotificationList = async (page: number, limit: number) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM Notifications where deletedAt is null`;
        // total count query
        const totalCountQuery = `SELECT COUNT(*) FROM Notifications where deletedAt is null`;
        const totalCountData = await executeQuery(totalCountQuery);
        const totalCount = totalCountData.rows[0][''];
        if (limit && page) {
            query += ` ORDER BY createdAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const data = await executeQuery(query);
        return {
            notifications: data.rows,
            totalCount: totalCount
        };
    }

    deleteNotification = async (notificationId: number) => {
        // Update the deletedAt timestamp instead of deleting the notification
        const query = `UPDATE Notifications SET deletedAt = GETDATE() WHERE id = '${notificationId}'`;
        return await executeQuery(query);
    }

    sendNotification = async (requestData: any) => {
        // First get the notification details from Notifications table usng requestData.notificationId
        const notificationDetailsQuery = `SELECT 
    n.id AS NotificationId,
    n.Title,
    n.MessageBody,
    n.NotificationType,
    n.ExpirationDate,
    n.DeliverySettings,
    STRING_AGG(nlu.UserId, ',') AS UserIds
FROM 
    Notifications n
LEFT JOIN 
    NotificationLinkedUsers nlu ON nlu.NotificationId = n.id where n.id = ${requestData.notificationId}
GROUP BY 
    n.id, n.Title, n.MessageBody, n.NotificationType, n.ExpirationDate, n.DeliverySettings;
`
      // Execute the query to get notification details
const notificationDetails = await executeQuery(notificationDetailsQuery);
const userIds = notificationDetails.rows[0]?.UserIds.split(',') || [];
const expireDate = notificationDetails.rows[0]?.ExpirationDate;
const formattedExpireDate = moment(expireDate).format('YYYY-MM-DD');


console.log("userIds:::", userIds);
console.log("formattedExpireDate:::", formattedExpireDate);

// Construct a single insert query
if (userIds.length > 0) {
    const values = userIds.map(userId => `(${requestData.notificationId}, ${userId}, 0, GETDATE(), '${formattedExpireDate}')`).join(', ');
    const insertQuery = `INSERT INTO SuperAdmin.dbo.UsersNotifications (NotificationId, UserId, IsRead, SentAt, ExpireDate) 
                         VALUES ${values}`;
    await executeQuery(insertQuery);
}

    }

    private generateLogInSignUpResponse = (
        userId: number,
        userName?: string,
        role?: string
    ) => {
        let jwtTokenPayload: Record<string, any> = {
            id: userId,
            username: userName,
            loginTime: new Date().toISOString(),
            role: role,
            login_type: "admin",
        };
        return {
            authorization_token: this.jwtService.generateToken(jwtTokenPayload),
            user_id: userId,
        };
    };

    // Function to convert special date strings to SQL date conditions
    private getDateCondition(
        dateString: string,
        field: string,
        start_from?: string,
        end_to?: string
    ): string {
        const today = new Date();
        let condition = "";

        if (start_from && end_to) {
            condition = `${field} >= '${start_from}' AND ${field} <= '${end_to}'`;
        }

        switch (dateString) {
            case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                condition = `${field} >= '${yesterday.toISOString().split("T")[0]} 00:00:00' AND ${field} < '${today.toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "today":
                condition = `${field} >= '${today.toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.setDate(today.getDate() + 1)).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "tomorrow":
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                condition = `${field} >= '${tomorrow.toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(tomorrow.setDate(tomorrow.getDate() + 1)).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "this_week":
                condition = `${field} >= '${new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.setDate(today.getDate() - today.getDay() + 7)).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "last_week":
                condition = `${field} >= '${new Date(today.setDate(today.getDate() - today.getDay() - 7)).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "next_week":
                condition = `${field} >= '${new Date(today.setDate(today.getDate() - today.getDay() + 7)).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.setDate(today.getDate() - today.getDay() + 14)).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "last_month":
                condition = `${field} >= '${new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "this_month":
                condition = `${field} >= '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "next_month":
                condition = `${field} >= '${new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "last_year":
                condition = `${field} >= '${new Date(today.getFullYear() - 1, 0, 1).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "this_year":
                condition = `${field} >= '${new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.getFullYear() + 1, 0, 1).toISOString().split("T")[0]} 00:00:00'`;
                break;
            case "next_year":
                condition = `${field} >= '${new Date(today.getFullYear() + 1, 0, 1).toISOString().split("T")[0]} 00:00:00' AND ${field} < '${new Date(today.getFullYear() + 2, 0, 1).toISOString().split("T")[0]} 00:00:00'`;
                break;
            // Add cases for other date strings as needed
            default:
                condition = `${field} LIKE '%${dateString}%'`; // Fallback for other strings
        }

        return condition;
    }

    private revenueAndSubscriptionMatricesQuery = () => {
        return `WITH SubscriptionData AS (
            SELECT 
                SH.userId,
                SH.plan_price AS PlanPrice,
                P.[plan_type],
                SH.startDate,
                SH.cancelledAt,
                ISNULL(DATEDIFF(DAY, SH.startDate, ISNULL(SH.cancelledAt, GETDATE())), 0) AS LifetimeDays,
                ROW_NUMBER() OVER (PARTITION BY SH.userId ORDER BY SH.startDate DESC) AS RowNum,
                LAG(P.price) OVER (PARTITION BY SH.userId ORDER BY SH.startDate) AS PreviousPlanPrice
            FROM 
                SuperAdmin.dbo.SubscriptionHistory SH
            JOIN 
                SuperAdmin.dbo.Plans P ON SH.planId = P.id
            WHERE 
                SH.status IN ('active', 'expired', 'cancelled')
        )
        SELECT 
            SUM(SD.PlanPrice) AS TotalRevenue,
            SUM(CASE WHEN SD.[plan_type] = 'monthly' THEN PlanPrice ELSE 0 END) AS MonthlyRecurringRevenue,
            SUM(CASE WHEN SD.[plan_type] = 'yearly' THEN PlanPrice ELSE 0 END) AS AnnualRecurringRevenue,
            SUM(SD.PlanPrice) / NULLIF(AVG(SD.LifetimeDays), 0) AS CustomerLifetimeValue,
            COUNT(CASE WHEN SD.PlanPrice > SD.PreviousPlanPrice THEN 1 END) AS UpgradeCount,
            COUNT(CASE WHEN SD.PlanPrice < SD.PreviousPlanPrice THEN 1 END) AS DowngradeCount,
            COUNT(CASE WHEN SD.PlanPrice = SD.PreviousPlanPrice THEN 1 END) AS SamePlanCount,
            CAST(COUNT(CASE WHEN SD.PlanPrice > SD.PreviousPlanPrice THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10, 2)) AS UpgradePercentage,
            CAST(COUNT(CASE WHEN SD.PlanPrice < SD.PreviousPlanPrice THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10, 2)) AS DowngradePercentage,
            CAST(COUNT(CASE WHEN SD.PlanPrice = SD.PreviousPlanPrice THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(10, 2)) AS SamePlanPercentage
        FROM 
            SubscriptionData SD;`;
    }

    private listOfClientsQuery = async(page: number, limit: number, companyId?: string, companyName?: string, planType?: string, planActivation?: string, revenueType?: string, totalRevenue?: string, startDate?: string, endDate?: string, rate?: string) => {
        const filters = [];
        // Adjust filters to use the CTE's column names
        if (companyId) {
            filters.push(`company_id LIKE '%${companyId}%'`);
        }
        if (companyName) {
            filters.push(`company_name LIKE '%${companyName}%'`);
        }
        if (planType) {
            filters.push(`plan_type LIKE '%${planType}%'`);
        }
        if (planActivation) {
            filters.push(`plan_activation LIKE '%${planActivation}%'`);
        }
        if (revenueType) {
            filters.push(`revenue_type LIKE '%${revenueType}%'`);
        }
        // if (totalRevenue) {
        //     filters.push(`total_revenue = ${Number(totalRevenue)}`);
        // }
        if (rate) {
            filters.push(`CurrentPlanPrice LIKE '%${rate}%'`);
        }
        
        // Start building the query
        let query = `WITH SubscriptionData AS (
            SELECT 
                CM.company_id,
                CM.company_name,
                P.plan_type,
                SH.status AS plan_activation,
                P.[plan_type] AS revenue_type,
                SUM(SH.plan_price) AS total_revenue,
                ROW_NUMBER() OVER (PARTITION BY SH.userId ORDER BY SH.startDate DESC) AS RowNum,
                LAG(P.price) OVER (PARTITION BY SH.userId ORDER BY SH.startDate) AS PreviousPlanPrice,
                P.price AS CurrentPlanPrice,
                SH.userId,  
                SH.startDate  
            FROM 
                SuperAdmin.dbo.SubscriptionHistory SH
            JOIN 
                SuperAdmin.dbo.Plans P ON SH.planId = P.id
            JOIN 
                SuperAdmin.dbo.ClientManagement CM ON SH.userId = CM.user_id
            WHERE 
                SH.status IN ('active', 'cancelled', 'expired')
            GROUP BY 
                CM.company_id,
                CM.company_name,
                P.plan_type,
                SH.status,
                P.[plan_type],
                P.price,
                SH.userId,  
                SH.startDate  
        ) 
        SELECT 
            company_id,
            company_name,
            CASE 
                WHEN MIN(plan_activation) = 'active' THEN 'active'
                ELSE 'expired'
            END AS plan_activation,
            MAX(plan_type) AS plan_type,
            SUM(total_revenue) AS total_revenue
        FROM 
            SubscriptionData`;
        
        // Append filters to the query
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }
        query += ` GROUP BY 
        company_id,
        company_name`;

        if (totalRevenue) {
            query += ` HAVING SUM(total_revenue) = ${Number(totalRevenue)}`;
        }
        
       
        const totalCountQuery = query;
        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY company_id OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        
        return { totalCountQuery, query };
        
    }
    

    private listOfClientsCountQuery = () => {
        let query = `WITH SubscriptionData AS (
            SELECT 
                CM.company_id,
                CM.company_name,
                P.plan_type,
                SH.status AS plan_activation,
                P.[plan_type] AS revenue_type,
                P.price AS total_revenue,
                ROW_NUMBER() OVER (PARTITION BY SH.userId ORDER BY SH.startDate DESC) AS RowNum,
                LAG(P.price) OVER (PARTITION BY SH.userId ORDER BY SH.startDate) AS PreviousPlanPrice,
                P.price AS CurrentPlanPrice
            FROM 
                SuperAdmin.dbo.SubscriptionHistory SH
            JOIN 
                SuperAdmin.dbo.Plans P ON SH.planId = P.id
            JOIN 
                SuperAdmin.dbo.ClientManagement CM ON SH.userId = CM.user_id
            WHERE 
                SH.status IN ('active', 'cancelled', 'expired')
        ),
        PlanChange AS (
            SELECT 
                company_id,
                company_name,
                plan_type,
                plan_activation,
                revenue_type,
                total_revenue,
                CASE 
                    WHEN CurrentPlanPrice > PreviousPlanPrice THEN 'Upgrades'
                    WHEN CurrentPlanPrice < PreviousPlanPrice THEN 'Downgrades'
                    ELSE 'Existing'
                END AS Rates
            FROM 
                SubscriptionData
            WHERE 
                RowNum = 1 
        )
        SELECT 
            *
        FROM 
            PlanChange`;

        return query;
    }

    private websiteAnalyticsQuery = (page: number, limit: number) => {
        let query = `SELECT * FROM Analytics`;
        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY createdAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        return query;
    }

    getFaq = async () => {
        const query = `SELECT * FROM FAQ order by CreatedDate desc`;
        const data = await executeQuery(query);
        return data.rows;
    }

    createFaq = async (question: string, answer: string) => {
        const query = `INSERT INTO FAQ (Question, Answer) VALUES ('${question}', '${answer}')`;
        const data = await executeQuery(query);
        return data.rows;
    }

    updateFaq = async (requestData: any) => {
        const query = `UPDATE FAQ SET Question = '${requestData.question}', Answer = '${requestData.answer}' WHERE id = ${requestData.faqId}`;
        const data = await executeQuery(query);
        return data.rows;
    }

    deleteFaq = async (faqId: number) => {
        const query = `DELETE FROM FAQ WHERE id = ${faqId}`;
        const data = await executeQuery(query);
        return data.rows;
    }

    getClientDashboard = async (DBName: string, userId: number) => {

        const dbConnect = await initializeDatabasePool();
        console.log("dbConnectdbConnect___", dbConnect)

        // Prepare all queries
        const jobStatusPieChartQuery = `SELECT 
            ROUND(COUNT(CASE WHEN Status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*), 2) AS CompletedJobsPercentage,
            ROUND(COUNT(CASE WHEN Status = 'FAILED' THEN 1 END) * 100.0 / COUNT(*), 2) AS FailedJobsPercentage,
            ROUND(COUNT(CASE WHEN Status = 'OTHER' THEN 1 END) * 100.0 / COUNT(*), 2) AS PartialCompletedJobsPercentage
            FROM 
                ${DBName}.dbo.JobFireEntries;`;

        const totalClientsQuery = `SELECT COUNT(*) AS total_clients FROM ${DBName}.dbo.Users`;

        const jobOnlineOfflineQuery = `SELECT 
            COUNT(CASE WHEN PingStatus = 'Success' AND CAST(EntryDateTime AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS success_count,
            COUNT(CASE WHEN PingStatus = 'Failed' AND CAST(EntryDateTime AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS failed_count,
            COUNT(CASE WHEN PingStatus = 'Success' AND Connection = 'Success' AND CAST(EntryDateTime AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS connectedJobCount
            FROM 
                ${DBName}.dbo.PingPathLogs;`;

        const latestSupportTicketDataQuery = `SELECT TOP 7
            cm.company_name,
            st.Topic AS support_subject,
            st.createdAt AS date_time,
            st.status AS status
            FROM 
                ClientManagement cm
            JOIN 
                SupportTickets st ON cm.user_id = st.userId WHERE st.userId = ${userId}
            ORDER BY 
                st.createdAt DESC;`;

        const supportTicketCountQuery = `
            WITH 
            SupportTicketCounts AS (
                SELECT 
                    COUNT(*) AS total_tickets,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_tickets,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_tickets,
                    ROUND((COUNT(CASE WHEN is_on_time = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2) AS response_on_time_percentage
                FROM SupportTickets where userId = ${userId}
            )
            SELECT 
                (SELECT total_tickets FROM SupportTicketCounts) AS totalTickets,
                (SELECT open_tickets FROM SupportTicketCounts) AS openTickets,
                (SELECT closed_tickets FROM SupportTicketCounts) AS closedTickets,
                (SELECT response_on_time_percentage FROM SupportTicketCounts) AS responseOnTimePercentage;`;

        const totalDataBackupQuery = `
            SELECT 
                SUM(CAST(DataInKB AS NUMERIC)) AS TotalDataInKB,
                CASE 
                    WHEN SUM(CAST(DataInKB AS NUMERIC)) >= 1099511627776 THEN CONCAT(ROUND(SUM(CAST(DataInKB AS NUMERIC)) / 1099511627776.0, 2), ' TB')
                    WHEN SUM(CAST(DataInKB AS NUMERIC)) >= 1073741824 THEN CONCAT(ROUND(SUM(CAST(DataInKB AS NUMERIC)) / 1073741824.0, 2), ' GB')
                    WHEN SUM(CAST(DataInKB AS NUMERIC)) >= 1048576 THEN CONCAT(ROUND(SUM(CAST(DataInKB AS NUMERIC)) / 1048576.0, 2), ' MB')
                    WHEN SUM(CAST(DataInKB AS NUMERIC)) >= 1024 THEN CONCAT(ROUND(SUM(CAST(DataInKB AS NUMERIC)) / 1024.0, 2), ' MB')
                    ELSE CONCAT(SUM(CAST(DataInKB AS NUMERIC)), ' KB')
                END AS TotalDataInReadableFormat
            FROM ${DBName}.dbo.JobFireEntries;`;

        const bannerQuery = `SELECT * FROM ClientWebsiteBanners WHERE user_id = ${userId}`;

        const softwareStatusQuery = `SELECT TOP 1
            jfe.Status,
            CASE 
                WHEN jfe.StartTime >= DATEADD(HOUR, -24, GETDATE()) AND jfe.Status = 'Completed' THEN 1 
                ELSE 0 
            END AS isActive,
            CASE 
                WHEN jfe.StartTime >= DATEADD(HOUR, -24, GETDATE()) AND jfe.Status = 'Completed' THEN jfe.StartTime 
                ELSE jfe.StartTime 
            END AS lastOnlineDateAndTime
            FROM 
                ${DBName}.dbo.JobFireEntries jfe
            ORDER BY 
                jfe.StartTime DESC;`;

        // Execute all queries in parallel
        const [
            jobStatusPieChartResult,
            totalClientsResult,
            jobOnlineOfflineResult,
            latestSupportTicketDataResult,
            supportTicketCountResult,
            totalDataBackupResult,
            bannerResult,
            softwareStatusResult
        ] = await Promise.all([
            executeQuery2(jobStatusPieChartQuery, dbConnect),
            executeQuery2(totalClientsQuery, dbConnect),
            executeQuery2(jobOnlineOfflineQuery, dbConnect),
            executeQuery2(latestSupportTicketDataQuery, dbConnect),
            executeQuery2(supportTicketCountQuery, dbConnect),
            executeQuery2(totalDataBackupQuery, dbConnect),
            executeQuery2(bannerQuery, dbConnect),
            executeQuery2(softwareStatusQuery, dbConnect)
        ]);

        const jobStatusPieChart = jobStatusPieChartResult.rows[0];
        const totalClients = totalClientsResult.rows[0].total_clients;
        const jobOnlineOffline = jobOnlineOfflineResult.rows[0];
        const latestSupportTicketData = latestSupportTicketDataResult.rows;
        const supportTicketCount = supportTicketCountResult.rows[0];
        const totalDataBackup = totalDataBackupResult.rows[0];

        let fullImagePath = null;
        // add path to banner
        if (bannerResult.rows[0] && bannerResult.rows[0]?.imagePath) {
            const relativePath = formateFrontImagePath(bannerResult.rows[0]?.imagePath);
            console.log("relativePath: ", relativePath);
            fullImagePath = `${getEnvVar("LOCAL_URL")}/assets/clientWebsiteBanners${relativePath}`;
        }

        const softwareStatus = softwareStatusResult.rows[0];

        return { jobStatusPieChart, totalClients, jobOnlineOffline, supportTicketCount, latestSupportTicketData, totalDataBackup, banner: fullImagePath, softwareStatus };
    }

    updateAdminProfile = async (adminId: number,file: Express.Multer.File) => {
        console.log("file:::", file.path);
        console.log("adminId:::", adminId);
        const query = `UPDATE Admin SET profilePhoto = '${file.path}' WHERE id = ${adminId}`;
        const data = await executeQuery(query); 

        const profilePhoto = formateFrontImagePath(file.path);
        return { profilePhoto: `${getEnvVar("LOCAL_URL")}/assets${profilePhoto}` };
    }

    getContactUs = async (page: number, limit: number, name?: string, phoneNo?: string, email?: string, subject?: string, message?: string, createdAt?: string) => {
        
        let query = `SELECT * FROM ContactUs`;

        const filters = [];
        if (name) {
            filters.push(`Name ILIKE '${name}'`);
        }
        if (phoneNo) {
            filters.push(`PhoneNo ILIKE '${phoneNo}'`);
        }
        if (email) {
            filters.push(`Email ILIKE '${email}'`);
        }
        if (subject) {
            filters.push(`Subject ILIKE '${subject}'`);
        }
        if (message) {
            filters.push(`Message ILIKE '${message}'`);
        }
        if (createdAt) {
            filters.push(this.getDateCondition(
                createdAt,
                "createdAt"
            ))
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }

        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY createdAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const totalCountQuery = `SELECT COUNT(*) FROM ContactUs`;
        const totalCount = await executeQuery(totalCountQuery);
        const data = await executeQuery(query);
        return { totalCount: totalCount.rows[0][''], data: data.rows };
    }

    getSignupUsers = async (page: number, limit: number, full_name?: string, email?: string, password?: string) => {
        let query = `SELECT * FROM Users`;

        const filters = [];
        if (full_name) {
            filters.push(`full_name LIKE '${full_name}'`);
        }
        if (email) {
            filters.push(`email LIKE '${email}'`);
        }
        if (password) {
            filters.push(`password LIKE '${password}'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }

        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY createdAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const totalCountQuery = `SELECT COUNT(*) FROM Users`;
        const totalCount = await executeQuery(totalCountQuery);
        const data = await executeQuery(query);
        return { totalCount: totalCount.rows[0][''], data: data.rows };
    }

    getTestimonial = async (page?: number, limit?: number) => {
        let query = `SELECT * FROM Testimonials`;
        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY CreatedAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }


        // Add the base URL IN the image path
        const baseUrl = getEnvVar("LOCAL_URL");
        const data = await executeQuery(query);
        const testimonialData = data.rows.map((testimonial: any) => {
            const relativePath = formateFrontImagePath(testimonial.Image);
            testimonial.Image = `${baseUrl}/assets${relativePath}`;
            return testimonial;
        });

        const totalDataQuery = `SELECT COUNT(*) FROM Testimonials`;
        const totalData = await executeQuery(totalDataQuery);
        return { totalData: totalData.rows[0][''], data: testimonialData };
    }

    addTestimonial = async (requestData: any, image: Express.Multer.File) => {
        const query = `INSERT INTO Testimonials (Name, Message, Image, CreatedAt) VALUES ('${requestData.name}', '${requestData.message}', '${image.path}', GETDATE())`;
        const data = await executeQuery(query);
        return data.rows;
    }

    deleteTestimonial = async (testimonialId: number) => {
        const query = `DELETE FROM Testimonials WHERE id = ${testimonialId}`;
        const data = await executeQuery(query);
        return data.rows;
    }

    // Integration images

    addIntegrationImages = async (image: Express.Multer.File) => {
        const query = `INSERT INTO IntegrationImages (Image, CreatedAt) VALUES ('${image.path}', GETDATE())`;
        const data = await executeQuery(query);
        return data.rows;
    }

    getIntegrationImages = async () => {
        const query = `SELECT * FROM IntegrationImages`;

        const baseUrl = getEnvVar("LOCAL_URL");
        const data = await executeQuery(query);
        const integrationImages = data.rows.map((image: any) => {
            const relativePath = formateFrontImagePath(image.Image);
            image.Image = `${baseUrl}/assets${relativePath}`;
            return image;
        });
        return integrationImages;
    }

    deleteIntegrationImages = async (integrationImageId: number) => {
        const query = `DELETE FROM IntegrationImages WHERE id = ${integrationImageId}`;
        const data = await executeQuery(query);
        return data.rows;
    }

    getFeedbackAndSuggestion = async (page: number, limit: number, username?: string, email?: string, subject?: string, type?: string, message?: string, createdAt?: string) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM FeedbackAndSuggestion`;

        const filters = [];
        if (username) {
            filters.push(`Username LIKE '${username}'`);
        }
        if (email) {
            filters.push(`Email LIKE '${email}'`);
        }
        if (subject) {
            filters.push(`Subject LIKE '${subject}'`);
        }
        if (type) {
            filters.push(`Type = '${type}'`);
        }
        if (message) {
            filters.push(`Message LIKE '${message}'`);
        }
        if (createdAt) {
            filters.push(this.getDateCondition(
                createdAt,
                "CreatedAt"
            ))
        }

        const totalQuery = `SELECT COUNT(*) FROM FeedbackAndSuggestion`;

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }

        if (page && limit) {
            query += ` ORDER BY CreatedAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const result = await executeQuery(query);

        const changeImagesPath = (imagePath: string) => {
            if(!imagePath) return null;
            const relativePath = formateFrontImagePath(imagePath);
            return `${getEnvVar("LOCAL_URL")}/assets${relativePath}`;
        }

        const feedbackAndSuggestion = result.rows.map((item: any) => {
            return {
                ...item,
                Image: item.Image !== null ? changeImagesPath(item.Image) : null // TODO
            }
        })
        const totalResult = await executeQuery(totalQuery);
        return { feedbackAndSuggestion, totalCount: totalResult.rows[0][''] };
    };

    getAdminEmailConfigration = async () => {
        const query = `SELECT * FROM AdminEmailConfig`;
        const data = await executeQuery(query);
        return data.rows;
    }

    updateAdminEmailConfigration = async (requestData: any) => {
        const query = `UPDATE AdminEmailConfig SET 
        SmtpServer = '${requestData.SmtpServer}',
        SmtpPort = ${requestData.SmtpPort},
        SenderEmail = '${requestData.SenderEmail}',
        Password = '${requestData.Password}',
        EnableTLS = ${requestData.EnableTLS ? 1 : 0}`;
        await executeQuery(query);
    }
}
