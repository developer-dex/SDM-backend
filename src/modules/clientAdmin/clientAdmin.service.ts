import {
    executeQuery,
    executeSqlQuery,
    retrieveData,
} from "../../config/databaseConfig";
import { clientAdminPermissions } from "../../helpers/constants";
import { JwtService } from "../../helpers/jwt.service";
import { calculatePagination } from "../../helpers/util";

export class ClientAdminService {
    private jwtService: JwtService;
    constructor() {
        this.jwtService = new JwtService();
    }

    loginInternal = async (requestData: any) => {
        const findUserQithTokenQuery = `SELECT * FROM Users WHERE login_token = '${requestData.token}'`;
        const findUserWithTokenResult = await executeQuery(
            findUserQithTokenQuery
        );
        console.log(
            "findUserWithTokenResult:::",
            findUserWithTokenResult.rows[0]
        );
        const responseData = this.generateLogInSignUpResponse(
            findUserWithTokenResult.rows[0].id,
            findUserWithTokenResult.rows[0].full_name,
            findUserWithTokenResult.rows[0].email,
            findUserWithTokenResult.rows[0].databaseName?.length > 0
                ? `${findUserWithTokenResult.rows[0].databaseName}.dbo`
                : "DEMODATA.dbo",
            "client"
        );

        return {
            ...findUserWithTokenResult.rows[0],
            ...responseData,
            role: "client",
            permissions: clientAdminPermissions,
        };
    };

    getBackupSS = async (
        DBName: string,
        page: number,
        limit: number,
        jobName?: string,
        ClientFolderName?: string,
        ClientData?: string,
        BaseFolderName?: string,
        BaseFolderData?: string,
        Difference?: string,
        Status?: string,
        EntryDateTime?: string,
        searchParameter?: string
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT Id, JobNo, JobId, JobName, ClientFolderName, ClientData, BaseFolderName, 
BaseFolderData, Difference, Status, EntryDateTime FROM ${DBName}.BackupSSLogs`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.BackupSSLogs`;

        // Initialize an array to hold filter conditions
        const filters = [];
        const searchFilters = [];
        if (searchParameter) {
            searchFilters.push(`JobName LIKE '%${searchParameter}%'`);
            searchFilters.push(`ClientFolderName LIKE '%${searchParameter}%'`);
            searchFilters.push(`ClientData LIKE '%${searchParameter}%'`);
            searchFilters.push(`BaseFolderName LIKE '%${searchParameter}%'`);
            searchFilters.push(`BaseFolderData LIKE '%${searchParameter}%'`);
            searchFilters.push(`Difference LIKE '%${searchParameter}%'`);
            searchFilters.push(`Status LIKE '%${searchParameter}%'`);
            searchFilters.push(`EntryDateTime LIKE '%${searchParameter}%'`);
        }

        // Check for each search parameter and add to filters
        if (jobName) {
            filters.push(`JobName LIKE '%${jobName}%'`);
        }
        if (ClientFolderName) {
            filters.push(`ClientFolderName LIKE '%${ClientFolderName}%'`);
        }
        if (ClientData) {
            filters.push(`ClientData LIKE '%${ClientData}%'`);
        }
        if (BaseFolderName) {
            filters.push(`BaseFolderName LIKE '%${BaseFolderName}%'`);
        }
        if (BaseFolderData) {
            filters.push(`BaseFolderData LIKE '%${BaseFolderData}%'`);
        }
        if (Difference) {
            filters.push(`Difference LIKE '%${Difference}%'`);
        }
        if (Status) {
            filters.push(`Status LIKE '%${Status}%'`);
        }
        if (EntryDateTime) {
            filters.push(`EntryDateTime LIKE '%${EntryDateTime}%'`);
        }
        

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
            console.log("query:::", query);
        }

        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;


        // Add pagination to the query
        if (limitData && offset) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);
        const result = await executeQuery(query);
        return { backupLogs: result.rows, totalCount };
    };

    getBackupSSCounts = async (DBName: string) => {
        const query = `SELECT COUNT(*) AS total_count FROM ${DBName}.BackupSSLogs`;
        const result = await retrieveData(query);
        return result;
    };

    getPingAndPath = async (
        DBName: string,
        page: number,
        limit: number,
        searchParameter?: string,
        jobName?: string,
        ipMachine?: string,
        sharedPath?: string,
        pingStatus?: string,
        connection?: string,
        errors?: string,
        entryDateTime?: string
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM ${DBName}.PingPathLogs`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.PingPathLogs`;

        // Initialize an array to hold filter conditions
        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`JobName LIKE '%${searchParameter}%'`);
            searchFilters.push(`IpMachine LIKE '%${searchParameter}%'`);
            searchFilters.push(`SharedPath LIKE '%${searchParameter}%'`);
            searchFilters.push(`PingStatus LIKE '%${searchParameter}%'`);
            searchFilters.push(`Connection LIKE '%${searchParameter}%'`);
            searchFilters.push(`EntryDateTime LIKE '%${searchParameter}%'`);
            searchFilters.push(`Errors LIKE '%${searchParameter}%'`);
        }

        // Check for each search parameter and add to filters
        if (jobName) {
            filters.push(`JobName LIKE '%${jobName}%'`);
        }
        if (ipMachine) {
            filters.push(`IpMachine LIKE '%${ipMachine}%'`);
        }
        if (sharedPath) {
            filters.push(`SharedPath LIKE '%${sharedPath}%'`);
        }
        if (pingStatus) {
            filters.push(`PingStatus LIKE '%${pingStatus}%'`);
        }
        if (connection) {
            filters.push(`Connection LIKE '%${connection}%'`);
        }
        if (errors) {
            filters.push(`Errors LIKE '%${errors}%'`);
        }
        if (entryDateTime) {
            filters.push(`EntryDateTime LIKE '%${entryDateTime}%'`);
        }

        // Add filters to the query if any exist
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (limitData && offset) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { pingLogs: result.rows, totalCount };
    };

    getPingAndPathCounts = async (DBName: string) => {
        const query = `
             SELECT 
                COUNT(*) AS total_count,
                SUM(CASE WHEN PingStatus = 'Success' THEN 1 ELSE 0 END) AS ping_success,
                SUM(CASE WHEN PingStatus = 'Failed' THEN 1 ELSE 0 END) AS ping_failed,
                SUM(CASE WHEN Connection = 'Success' THEN 1 ELSE 0 END) AS connection_success,
                SUM(CASE WHEN Connection = 'Skipped' THEN 1 ELSE 0 END) AS connection_failed
            FROM 
                ${DBName}.PingPathLogs`;
        const result = await retrieveData(query);
        return result;
    };

    getAuditTrailLog = async (
        DBName: string,
        page: number,
        limit: number,
        searchParameter?: string,
        username?: string,
        jobName?: string,
        action?: string,
        oldValue?: string,
        newValue?: string
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM ${DBName}.AuditTrail`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.AuditTrail`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`Username LIKE '%${searchParameter}%'`);
            searchFilters.push(`jobName LIKE '%${searchParameter}%'`);
            searchFilters.push(`Action LIKE '%${searchParameter}%'`);
            searchFilters.push(`OldValue LIKE '%${searchParameter}%'`);
            searchFilters.push(`NewValue LIKE '%${searchParameter}%'`);
        }

        if (username) {
            filters.push(`Username LIKE '%${username}%'`);
        }
        if (jobName) {
            filters.push(`jobName LIKE '%${jobName}%'`);
        }
        if (action) {
            filters.push(`Action LIKE '%${action}%'`);
        }
        if (oldValue) {
            filters.push(`OldValue LIKE '%${oldValue}%'`);
        }
        if (newValue) {
            filters.push(`NewValue LIKE '%${newValue}%'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { auditLogs: result.rows, totalCount };
    };

    getJobFireStatistics = async (
        DBName: string,
        page: number,
        limit: number,
        searchParameter?: string,
        jobName?: string,
        jobGroup?: string,
        sourceIp?: string,
        sourceFolder?: string,
        destinationFolder?: string,
        status?: string,
        startTime?: string
    ) => {
        let query = `SELECT * FROM ${DBName}.JobFireEntries`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.JobFireEntries`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`JobName LIKE '%${searchParameter}%'`);
            searchFilters.push(`JobGroup LIKE '%${searchParameter}%'`);
            searchFilters.push(`SourceIp LIKE '%${searchParameter}%'`);
            searchFilters.push(`SourceFolder LIKE '%${searchParameter}%'`);
            searchFilters.push(`DestinationFolder LIKE '%${searchParameter}%'`);
            searchFilters.push(`Status LIKE '%${searchParameter}%'`);
            searchFilters.push(`StartTime LIKE '%${searchParameter}%'`);
        }

        if (jobName) {
            filters.push(`JobName LIKE '%${jobName}%'`);
        }
        if (jobGroup) {
            filters.push(`JobGroup LIKE '%${jobGroup}%'`);
        }
        if (sourceIp) {
            filters.push(`SourceIp LIKE '%${sourceIp}%'`);
        }
        if (sourceFolder) {
            filters.push(`SourceFolder LIKE '%${sourceFolder}%'`);
        }
        if (destinationFolder) {
            filters.push(`DestinationFolder LIKE '%${destinationFolder}%'`);
        }
        if (status) {
            filters.push(`Status LIKE '%${status}%'`);
        }
        if (startTime) {
            filters.push(`StartTime LIKE '%${startTime}%'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(
                page,
                limit
            );
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { jobFireLogs: result.rows, totalCount };
    };

    // User management
    getUsersList = async (
        DBName: string,
        page: number,
        limit: number,
        searchParameter?: string,
        username?: string,
        email?: string,
        role?: string,
        phone?: string,
        entryDate?: string,
        moduleNames?: string,
        password?: string
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT 
    u.ID, 
    u.UserName, 
    u.[Role], 
    u.Password, 
    u.Phone, 
    u.Email, 
    u.ProfilePicture, 
    u.EntryDate,
    STRING_AGG(up.ModuleName, ', ') AS ModuleNames
FROM 
    ${DBName}.Users u
LEFT JOIN 
    ${DBName}.UserPermissions up ON u.ID = up.UserID`;

        let countQuery = `SELECT 
        COUNT(DISTINCT u.ID) AS total_count
    FROM 
        ${DBName}.Users u
    LEFT JOIN 
        ${DBName}.UserPermissions up ON u.ID = up.UserID`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`u.UserName LIKE '%${searchParameter}%'`);
            searchFilters.push(`u.Email LIKE '%${searchParameter}%'`);
            searchFilters.push(`u.Role LIKE '%${searchParameter}%'`);
            searchFilters.push(`u.Phone LIKE '%${searchParameter}%'`);
            searchFilters.push(`u.EntryDate LIKE '%${searchParameter}%'`);
            searchFilters.push(`STRING_AGG(up.ModuleName, ', ') LIKE '%${searchParameter}%'`);
            searchFilters.push(`u.Password LIKE '%${searchParameter}%'`);
        }

        if (username) {
            filters.push(`u.UserName LIKE '%${username}%'`);
        }
        if (email) {
            filters.push(`u.Email LIKE '%${email}%'`);
        }
        if (role) {
            filters.push(`u.Role LIKE '%${role}%'`);
        }
        if (phone) {
            filters.push(`u.Phone LIKE '%${phone}%'`);
        }
        if (entryDate) {
            filters.push(`u.EntryDate LIKE '%${entryDate}%'`);
        }
        if (moduleNames) {
            filters.push(`STRING_AGG(up.ModuleName, ', ') LIKE '%${moduleNames}%'`);
        }
        if (password) {
            filters.push(`u.Password LIKE '%${password}%'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        query += ` GROUP BY 
        u.ID,
        u.UserName,
        u.[Role],
        u.Password,
        u.Phone,
        u.Email,
        u.ProfilePicture,
        u.EntryDate`;

        if (page && limit) {
            query += ` ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);
        console.log("countQuery:::", countQuery);
        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { users: result.rows, totalCount };
    };

    private generateLogInSignUpResponse = (
        userId: number,
        userName?: string,
        userEmail?: string,
        databaseName?: string,
        login_type?: string
    ) => {
        let jwtTokenPayload: Record<string, any> = {
            id: userId,
            username: userName,
            userEmail: userEmail,
            loginTime: new Date().toISOString(),
            databaseName: databaseName,
            login_type: login_type
        };
        return {
            authorization_token: this.jwtService.generateToken(jwtTokenPayload),
            user_id: userId,
        };
    };
}
