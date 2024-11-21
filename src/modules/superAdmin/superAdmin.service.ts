import { executeSqlQuery, retrieveData } from "../../config/databaseConfig";
import { JwtService } from "../../helpers/jwt.service";
import { ResponseService } from "../../helpers/response.service";
import getEnvVar, { calculatePagination } from "../../helpers/util";
import {
    IChangeNotificationStatusRequest,
    IClientRequest,
    ISignInRequest,
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
        const responseData = this.generateLogInSignUpResponse(result[0].id);
        return { ...result[0], ...responseData, role: "admin" };
    };

    getAllClients = async (
        page?: number,
        limit?: number,
        searchParameter?: string
    ) => {
        // Count total number of clients
        // const totalCountQuery = `SELECT COUNT(*) as count FROM Admin`;
        // const totalCount = await retrieveData(totalCountQuery);
        // console.log("totalCount:::", totalCount);
        // const totalCountData = totalCount;


        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM Admin`;
        if (searchParameter) {
            query += ` WHERE full_name LIKE '%${searchParameter}%' OR email LIKE '%${searchParameter}%' OR phoneNo LIKE '%${searchParameter}%'`;
        }
        query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        const admins = await retrieveData(query);
        return { 
            admins,
            //  totalCountData 
            };
    };

    deleteClient = async (clientId: number) => {
        const query = `DELETE FROM Client WHERE _id = '${clientId}'`;
        const clients = await executeSqlQuery(query);
        return clients;
    };

    updateClient = async (requestData: IClientRequest, userId: number) => {
        const { full_name, email, password, role, permissions, phoneNo } =
            requestData;
        const query = `UPDATE Admin SET full_name = '${full_name}', email = '${email}', password = '${password}', role = '${role}', permissions = '${permissions}', phoneNo = '${phoneNo}' WHERE id = '${userId}'`;
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
        return await retrieveData(query);
    };

    changeNotificationStatus = async (
        requestData: IChangeNotificationStatusRequest
    ) => {
        const { notificationId, status } = requestData;
        const query = `UPDATE Notifications SET status = ${status} WHERE id = ${notificationId}`;
        console.log("query:::", query);
        return await executeSqlQuery(query);
    };

    checkClientIsAccessable = async (id: number) => {
        const query = `SELECT * FROM Client where id = '${id}'`;
        const clients = await retrieveData(query);
        return clients;
    };

    isExistClient = async (whereCondition: string) => {
        const query = `SELECT * FROM Admin WHERE ${whereCondition}`;
        const clients = await retrieveData(query);
        return clients;
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
