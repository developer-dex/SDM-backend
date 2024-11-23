import { StatusCodes } from "../../common/responseStatusEnum";
import { executeSqlQuery, retrieveData } from "../../config/databaseConfig";
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
        const responseData = this.generateLogInSignUpResponse(result.rows[0].id);
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
          console.log("totalCountData:::", totalCountData)
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
          console.log("admins:::", JSON.stringify(adminsResult))
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
        console.log("query:::", query);
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
        let query = `SELECT * FROM ClientManagement`;
        if (searchParameter) {
            query += ` WHERE company_name LIKE '%${searchParameter}%' OR
            company_address LIKE '%${searchParameter}%' OR
            gst LIKE '%${searchParameter}%' OR
            pan LIKE '%${searchParameter}%' OR
            industry_type LIKE '%${searchParameter}%' OR
            company_id LIKE '%${searchParameter}%'`;
        }
        if (company_name) {
            query += ` WHERE company_name LIKE '%${company_name}%'`;
        }
        if (company_address) {
            query += ` WHERE company_address LIKE '%${company_address}%'`;
        }
        if (start_date) {
            query += ` WHERE created_at >= '${start_date}'`;
        }
        if (end_date) {
            query += ` WHERE created_at <= '${end_date}'`;
        }
        if (payment_method) {
            query += ` WHERE payment_method = '${payment_method}'`;
        }
        if (status) {
            query += ` WHERE status = '${status}'`;
        }
        const { offset, limit: limitData } = calculatePagination(page, limit);
        query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        console.log("query:::", query);
        const data = await retrieveData(query);
        return data.rows;
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
        } = requestData;
        const query = `INSERT INTO ClientManagement (company_name, company_address, payment_method, gst, pan, industry_type, company_id, status, plan_id, plan_type, cost) VALUES ('${company_name}', '${company_address}', '${payment_method}', '${gst_number}', '${pan_number}', '${industry_type}', '${company_id}', '${status}', '${plan_id}', '${plan_type}', ${cost})`;
        return await executeSqlQuery(query);
    };

    deleteClient = async (companyId: string) => {
        const query = `DELETE FROM ClientManagement WHERE company_id = '${companyId}'`;
        return await executeSqlQuery(query);
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
            plan_id,
            plan_type,
            cost,
            user_id,
        } = requestData;
        const query = `UPDATE ClientManagement SET company_name = '${company_name}', company_address = '${company_address}', payment_method = '${payment_method}', gst_number = '${gst_number}', pan_number = '${pan_number}', industry_type = '${industry_type}', company_id = '${company_id}', status = '${status}', plan_id = '${plan_id}', plan_type = '${plan_type}', cost = ${cost} WHERE company_id = '${user_id}'`;
        return await executeSqlQuery(query);
    };

    // Licenses Management

    getAllLicenses = async (page: number, limit: number) => {
        let query = `SELECT * FROM Licenses`;
        const { offset, limit: limitData } = calculatePagination(page, limit);
        query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        const data = await retrieveData(query);
        return data.rows;
    };

    createLicense = async (requestData: ICreateLicenseRequest) => {
        const findUserQuery = `SELECT id FROM Users WHERE email = '${requestData.user_email}'`;
        const user = await retrieveData(findUserQuery);
        if (user.rowCount === 0) {
            return this.responseService.responseWithoutData(
                false,
                StatusCodes.BAD_REQUEST,
                "User not found"
            );
        }
        const {
            issue_date,
            expiry_date,
            license_type,
            status,
            company_id,
            company_name,
            company_pan,
        } = requestData;
        const license_key = generateLicenseKey(
            license_type,
            company_pan,
            issue_date,
            expiry_date
        );
        const query = `INSERT INTO Licenses (user_id, issue_date, expiry_date, license_key, license_type, status, company_id, company_name, company_pan) VALUES ('${user[0].id}', '${issue_date}', '${expiry_date}', '${license_key}', '${license_type}', '${status}', '${company_id}', '${company_name}', '${company_pan}')`;
        return await executeSqlQuery(query);
    };

    deleteLicense = async (licenseId: number) => {
        const query = `DELETE FROM Licenses WHERE id = '${licenseId}'`;
        return await executeSqlQuery(query);
    };

    updateLicense = async (requestData: ICreateLicenseRequest) => {
        const { license_id, license_type, issue_date, expiry_date, status, company_id, company_name, company_pan } = requestData;
        const license_key = generateLicenseKey(
            license_type,
            company_pan,
            issue_date,
            expiry_date
        );
        const query = `UPDATE Licenses SET license_key = '${license_key}', license_type = '${license_type}', issue_date = '${issue_date}', expiry_date = '${expiry_date}', status = '${status}', company_id = '${company_id}', company_name = '${company_name}', company_pan = '${company_pan}' WHERE id = '${license_id}'`;
        return await executeSqlQuery(query);
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
