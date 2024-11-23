import { StatusCodes } from "../../common/responseStatusEnum";
import {
    executeQuery,
    executeSqlQuery,
    retrieveData,
} from "../../config/databaseConfig";
import { JwtService } from "../../helpers/jwt.service";
import { ResponseService } from "../../helpers/response.service";
import { calculatePagination, generateLicenseKey } from "../../helpers/util";
import {
    IChangeNotificationStatusRequest,
    ICreateClientRequest,
    ICreateLicenseRequest,
    ISignInRequest,
    IUserRequest,
} from "./superAdmin.interface";

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
        const result = await retrieveData(query);
        console.log("result:::", result);
        if (result.rowCount === 0) {
            return [];
        }
        const responseData = this.generateLogInSignUpResponse(
            result.rows[0].id
        );
        return { ...result.rows[0], ...responseData, role: "admin" };
    };

    getAllUsers = async (
        page?: number,
        limit?: number,
        searchParameter?: string
    ) => {
        // Count total number of clients
        const totalCountQuery = `SELECT COUNT(*) as count FROM Admin`;
        let totalCountData;

        try {
            const totalCountResult = await retrieveData(totalCountQuery);
            totalCountData = totalCountResult.rows[0].count; // Access the count from the query result
            console.log("totalCountData:::", totalCountData);
        } catch (err) {
            console.error("Error fetching total count:", err);
            throw new Error("Failed to fetch total count.");
        }

        // Pagination
        const { offset, limit: limitData } = calculatePagination(page, limit);

        let query = `SELECT * FROM Admin`;
        if (searchParameter) {
            query += ` WHERE full_name LIKE '%${searchParameter}%' OR email LIKE '%${searchParameter}%' OR phoneNo LIKE '%${searchParameter}%'`;
        }
        query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;

        let admins;
        try {
            const adminsResult = await retrieveData(query);
            admins = adminsResult.rows;
            console.log("admins:::", JSON.stringify(adminsResult));
        } catch (err) {
            console.error("Error fetching admins:", err);
            throw new Error("Failed to fetch admins.");
        }

        return {
            admins,
            totalCount: totalCountData,
        };
    };

    deleteUser = async (clientId: number) => {
        const query = `DELETE FROM Admin WHERE id = '${clientId}'`;
        const clients = await executeSqlQuery(query);
        return clients;
    };

    updateUser = async (requestData: IUserRequest) => {
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
        return await executeSqlQuery(query);
    };

    addClient = async (requestData: any) => {
        const { full_name, email, password, role, permissions, phoneNo } =
            requestData;
        const query = `INSERT INTO Admin (full_name, email, password, role, permissions, phoneNo) VALUES ('${full_name}', '${email}', '${password}', '${role}', '${permissions}', '${phoneNo}')`;
        return await executeSqlQuery(query);
    };

    getNotifications = async () => {
        console.log("getNotifications:::");
        const query = `SELECT * FROM Notifications`;
        const data = await retrieveData(query);
        return data.rows;
    };

    changeNotificationStatus = async (
        requestData: IChangeNotificationStatusRequest
    ) => {
        const { notificationId, status } = requestData;
        const query = `UPDATE Notifications SET status = ${status} WHERE id = ${notificationId}`;
        return await executeSqlQuery(query);
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
        status?: string
    ) => {
        let query = `SELECT cm.company_name, cm.id, cm.company_address, cm.gst, cm.pan, cm.industry_type, cm.company_id, cm.plan_type, cm.cost, cm.status, cm.payment_method,cm.created_at, u.email FROM ClientManagement cm LEFT JOIN Users u ON cm.user_id = u.id`;
        if (searchParameter) {
            query += ` WHERE cm.company_name LIKE '%${searchParameter}%' OR
            cm.company_address LIKE '%${searchParameter}%' OR
            cm.gst LIKE '%${searchParameter}%' OR
            cm.pan LIKE '%${searchParameter}%' OR
            cm.industry_type LIKE '%${searchParameter}%' OR
            cm.company_id LIKE '%${searchParameter}%'`;
        }
        if (company_name) {
            query += ` AND cm.company_name LIKE '%${company_name}%'`;
        }
        if (company_address) {
            query += ` AND cm.company_address LIKE '%${company_address}%'`;
        }
        if (start_date) {
            query += ` AND cm.created_at >= '${start_date}'`;
        }
        if (end_date) {
            query += ` AND cm.created_at <= '${end_date}'`;
        }
        if (payment_method) {
            query += ` AND cm.payment_method = '${payment_method}'`;
        }
        if (status) {
            query += ` AND cm.status = '${status}'`;
        }
        const { offset, limit: limitData } = calculatePagination(page, limit);
        query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        const data = await executeQuery(query);

        // total count of client
        const totalCountQuery = `SELECT COUNT(*) as count FROM ClientManagement`;
        const totalCountData = await executeQuery(totalCountQuery);
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
        const query = `INSERT INTO ClientManagement (company_name, company_address, payment_method, gst, pan, industry_type, company_id, status, plan_type, cost, user_id) VALUES ('${company_name}', '${company_address}', '${payment_method}', '${gst_number}', '${pan_number}', '${industry_type}', '${company_id}', '${status}', '${plan_type}', ${cost}, ${user_id})`;
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
        } = requestData;
        const query = `UPDATE ClientManagement SET company_name = '${company_name}', company_id = '${company_id}', company_address = '${company_address}', payment_method = '${payment_method}', gst = '${gst_number}', pan = '${pan_number}', industry_type = '${industry_type}', status = '${status}', plan_type = '${plan_type}', cost = ${cost} WHERE id = '${id}'`;
        return await executeQuery(query);
    };

    // Licenses Management

    getAllLicenses = async (page: number, limit: number) => {
        let query = `SELECT l.issue_date, l.id as license_id, l.expiration_date, l.license_key, l.license_type, l.status, l.company_id, l.company_name, l.company_pan, u.email FROM Licenses l LEFT JOIN Users u on u.id = l.user_id`;
        const { offset, limit: limitData } = calculatePagination(page, limit);
        query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        const data = await executeQuery(query);

        // totalCount
        const totalCountQuery = `SELECT COUNT(*) as count FROM Licenses`;
        const totalCountData = await executeQuery(totalCountQuery);
        return {
            licenses: data.rows,
            totalCount: totalCountData.rows[0].count,
        };
    };

    createLicense = async (requestData: ICreateLicenseRequest) => {

        const findUserQuery = `SELECT cm.company_id, cm.company_name, cm.pan, p.plan_name, u.id FROM Users u 
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
        const {
            issue_date,
            expiry_date,
            status,
        } = requestData;

        console.log("Checking values:", {
            userId: user.rows[0].id,
            issueDate: issue_date,
            expiryDate: expiry_date,
        });

          // Ensure that the required fields are defined
          if (!user.rows[0].id || !issue_date || !expiry_date) {
            throw new Error("Required fields are missing.");
        }


        const license_key = generateLicenseKey(
            user.rows[0].plan_name,
            user.rows[0].pan,
            issue_date,
            expiry_date
        );

        console.log("license_key:::", license_key);
        const query = `INSERT INTO Licenses (user_id, issue_date, expiration_date, license_key, license_type, status, company_id, company_name, company_pan) VALUES ('${user.rows[0].id}', '${issue_date}', '${expiry_date}', '${license_key}', '${user.rows[0].plan_name}', '${status}', '${user.rows[0].company_id}', '${user.rows[0].company_name}', '${user.rows[0].pan}')`;
        return await executeQuery(query);
    };

    deleteLicense = async (licenseId: number) => {
        const query = `DELETE FROM Licenses WHERE id = '${licenseId}'`;
        return await executeQuery(query);
    };

    updateLicense = async (requestData: ICreateLicenseRequest) => {
        const findUserQuery = `SELECT cm.company_id, cm.company_name, cm.pan, p.plan_name FROM Users u 
        LEFT JOIN ClientManagement cm ON cm.user_id = u.id 
        LEFT JOIN Subscription s ON s.userId = u.id
        LEFT JOIN Plan p ON p.id = s.planId
        WHERE u.id = '${requestData.user_id}'`;
        const user = await executeQuery(findUserQuery);
        if (user.rows.length === 0) {
            return this.responseService.responseWithoutData(
                false,
                StatusCodes.BAD_REQUEST,
                "User not found"
            );
        }
        const {
            license_id,
            issue_date,
            expiry_date,
            status,
        } = requestData;
        const license_key = generateLicenseKey(
            user[0].plan_name,
            user[0].pan,
            issue_date,
            expiry_date
        );
        const query = `UPDATE Licenses SET license_key = '${license_key}', license_type = '${user[0].plan_name}', issue_date = '${issue_date}', expiration_date = '${expiry_date}', status = '${status}', company_id = '${user[0].company_id}', company_name = '${user[0].company_name}', company_pan = '${user[0].pan}' WHERE id = '${license_id}'`;
        return await executeSqlQuery(query);
    };

    // Customer Management

    getAllCustomers = async () => {
        // const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM Users`;
        // if(limit && page) {
        //     query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        // }
        const data = await executeQuery(query);
        return {
            customers: data.rows,
        };
    };

    checkClientIsAccessable = async (id: number) => {
        const query = `SELECT * FROM Client where id = '${id}'`;
        const clients = await retrieveData(query);
        return clients.rows;
    };

    isExistClient = async (whereCondition: string) => {
        const query = `SELECT * FROM Admin WHERE ${whereCondition}`;
        const clients = await retrieveData(query);
        return clients.rows;
    };

    getDatabyConnection = async (query: string) => {
        const data = await executeQuery(query);
        return data.rows;
    };

    private generateLogInSignUpResponse = (userId: number) => {
        let jwtTokenPayload: Record<string, any> = {
            _id: userId,
        };
        return {
            authorization_token: this.jwtService.generateToken(jwtTokenPayload),
            user_id: userId,
        };
    };
}
