import moment from "moment";
import { executeQuery, retrieveData } from "../../config/databaseConfig";
import { clientAdminPermissions } from "../../helpers/constants";
import { JwtService } from "../../helpers/jwt.service";
import sendCsvToMail, { sendMultipleCsvToMail } from "../../helpers/sendMail";
import getEnvVar, {
    calculatePagination,
    formateFrontImagePath,
    sleep,
} from "../../helpers/util";
import { EPlanStatus } from "../plan/plan.interface";
import fs from "fs";

export class ClientAdminService {
    private jwtService: JwtService;
    constructor() {
        this.jwtService = new JwtService();
    }

    loginInternal = async (requestData: any) => {
        const findUserQithTokenQuery = `SELECT * FROM Users WHERE uuid = '${requestData.token}'`;
        console.log("findUserQithTokenQuery", findUserQithTokenQuery);
        const findUserWithTokenResult = await executeQuery(
            findUserQithTokenQuery
        );

        console.log("findUserWithTokenResult", findUserWithTokenResult);

        if(findUserWithTokenResult.rows[0].databaseName) {
            const isDatabaseisExist = await this.isDatabaseisExist(findUserWithTokenResult.rows[0].databaseName);
            console.log("isDatabaseisExist", isDatabaseisExist);
            if(!isDatabaseisExist) {
                return false;
            }
        }
        if (
            !findUserWithTokenResult ||
            !findUserWithTokenResult.rows ||
            !findUserWithTokenResult.rows[0] ||
            !findUserWithTokenResult.rows[0].databaseName ||
            findUserWithTokenResult.rows[0].databaseName.length === 0
        ) {
            return false;
        }

        // client current subsc
        const responseData = this.generateLogInSignUpResponse(
            findUserWithTokenResult.rows[0].id,
            findUserWithTokenResult.rows[0].full_name,
            findUserWithTokenResult.rows[0].email,
            findUserWithTokenResult.rows[0].databaseName?.length > 0
                ? `${findUserWithTokenResult.rows[0].databaseName}.dbo`
                : "DEMODATA.dbo",
            "client"
        );
        console.log(
            "findUserWithTokenResult.rows[0].databaseName:::",
            findUserWithTokenResult.rows[0].databaseName
        );
        const softwareStatus = await this.getSoftwareStatus(
            `${findUserWithTokenResult.rows[0].databaseName}.dbo`
        );
        // softwareStatus.isActive = 1;
        return {
            ...findUserWithTokenResult.rows[0],
            ...responseData,
            role: "client",
            permissions: clientAdminPermissions,
            softwareStatus: softwareStatus,
        };
    };

    isDatabaseisExist = async (DBName: string) => {
        const query = `IF EXISTS (SELECT * FROM sys.databases WHERE name = '${DBName}')
    SELECT 1 AS DatabaseExists
ELSE
    SELECT 0 AS DatabaseExists`;
        const result = await executeQuery(query);
        return result.rows[0].DatabaseExists;
    };

    getClientManagement = async (
        DBName: string,
        page?: number,
        limit?: number,
        ClientId?: number,
        Name?: string,
        JobGroup?: string,
        IpMachineName?: string,
        FolderName?: string,
        UserName?: string,
        Password?: string,
        Quota?: number,
        QuotaUnit?: string,
        Description?: string,
        EntryTime?: string,
        Remarks?: string,
        searchParameter?: string
    ) => {
        console.log("DBName:::", DBName);
        let query = `SELECT * FROM ${DBName}.Clients`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.Clients`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`ClientId LIKE '%${searchParameter}%'`);
            searchFilters.push(`Name LIKE '%${searchParameter}%'`);
            searchFilters.push(`IpMachineName LIKE '%${searchParameter}%'`);
            searchFilters.push(`FolderName LIKE '%${searchParameter}%'`);
            searchFilters.push(`UserName LIKE '%${searchParameter}%'`);
            searchFilters.push(`Password LIKE '%${searchParameter}%'`);
            searchFilters.push(`Quota LIKE '%${searchParameter}%'`);
            searchFilters.push(`QuotaUnit LIKE '%${searchParameter}%'`);
            searchFilters.push(`Description LIKE '%${searchParameter}%'`);
            searchFilters.push(`EntryTime LIKE '%${searchParameter}%'`);
            searchFilters.push(`Remarks LIKE '%${searchParameter}%'`);
            searchFilters.push(`JobGroup LIKE '%${searchParameter}%'`);
        }

        if (ClientId) {
            filters.push(`ClientId = ${ClientId}`);
        }
        if (Name) {
            filters.push(`Name LIKE '%${Name}%'`);
        }
        if (JobGroup) {
            filters.push(`JobGroup = '${JobGroup}'`);
        }
        if (IpMachineName) {
            filters.push(`IpMachineName LIKE '%${IpMachineName}%'`);
        }
        if (FolderName) {
            filters.push(`FolderName LIKE '%${FolderName}%'`);
        }
        if (UserName) {
            filters.push(`UserName LIKE '%${UserName}%'`);
        }
        if (Password) {
            filters.push(`Password LIKE '%${Password}%'`);
        }
        if (Quota) {
            filters.push(`Quota = ${Quota}`);
        }
        if (QuotaUnit) {
            filters.push(`QuotaUnit = '${QuotaUnit}'`);
        }
        if (Description) {
            filters.push(`Description LIKE '%${Description}%'`);
        }
        if (EntryTime) {
            filters.push(this.getDateCondition(EntryTime, "EntryTime"));
        }
        if (Remarks) {
            filters.push(`Remarks LIKE '%${Remarks}%'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (page && limit) {
            const { offset, limit: limitData } = calculatePagination(page, limit);
            query += ` ORDER BY ClientID DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);

        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { data: result.rows, totalCount };
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

        let otherBackUpSSDataQuery = `SELECT 
        SUM(ClientData) AS total_data_client,
        SUM(BaseFolderData) AS total_data_base,
        SUM(Difference) AS total_data_difference
        FROM ${DBName}.BackupSSLogs`;

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
            filters.push(this.getDateCondition(EntryDateTime, "EntryDateTime"));
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
            otherBackUpSSDataQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
            otherBackUpSSDataQuery += ` WHERE ${searchFilters.join(" OR ")}`;
            console.log("query:::", query);
        }

        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;

        const otherBackUpSSDataResult = await executeQuery(
            otherBackUpSSDataQuery
        );
        const otherBackUpSSData = otherBackUpSSDataResult.rows[0];

        // Add pagination to the query
        if (page && limit) {
            query += ` ORDER BY Id DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);
        const result = await executeQuery(query);
        return { backupLogs: result.rows, totalCount, otherBackUpSSData };
    };

    getBackupJobs = async (DBName: string, page: number, limit: number, searchParameter?: string, JobName?: string, JobGroup?: string, BackupType?: string, Days?: string, SourceIp?: string, SourceFolder?: string, SourceUsername?: string, SourcePassword?: string, Description?: string, EntryDate?: string, StartTime?: string, EndTime?: string, JobEnabled?: string, JobPriority?: string, ExtnDetails?: string, ExtnType?: string) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM ${DBName}.BackupJobs`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.BackupJobs`;

        const filters = [];
        const searchFilters = [];

        if(searchParameter) {
            searchFilters.push(`JobName LIKE '%${searchParameter}%'`);
            searchFilters.push(`JobGroup LIKE '%${searchParameter}%'`);
            searchFilters.push(`BackupType LIKE '%${searchParameter}%'`);
            searchFilters.push(`Days LIKE '%${searchParameter}%'`);
            searchFilters.push(`SourceIp LIKE '%${searchParameter}%'`);
            searchFilters.push(`SourceFolder LIKE '%${searchParameter}%'`);
            searchFilters.push(`SourceUsername LIKE '%${searchParameter}%'`);
            searchFilters.push(`SourcePassword LIKE '%${searchParameter}%'`);
            searchFilters.push(`Description LIKE '%${searchParameter}%'`);
            searchFilters.push(`EntryDate LIKE '%${searchParameter}%'`);
            searchFilters.push(`StartTime LIKE '%${searchParameter}%'`);
            searchFilters.push(`EndTime LIKE '%${searchParameter}%'`);
            searchFilters.push(`JobEnabled LIKE '%${searchParameter}%'`);
            searchFilters.push(`JobPriority LIKE '%${searchParameter}%'`);
            searchFilters.push(`ExtnDetails LIKE '%${searchParameter}%'`);
            searchFilters.push(`ExtnType LIKE '%${searchParameter}%'`);
        }

        if(JobName) {
            filters.push(`JobName LIKE '%${JobName}%'`);
        }
        if(JobGroup) {
            filters.push(`JobGroup LIKE '%${JobGroup}%'`);
        }
        if(BackupType) {
            filters.push(`BackupType LIKE '%${BackupType}%'`);
        }
        if(Days) {
            filters.push(`Days LIKE '%${Days}%'`);
        }
        if(SourceIp) {
            filters.push(`SourceIp LIKE '%${SourceIp}%'`);
        }
        if(SourceFolder) {
            filters.push(`SourceFolder LIKE '%${SourceFolder}%'`);
        }
        if(SourceUsername) {
            filters.push(`SourceUsername LIKE '%${SourceUsername}%'`);
        }
        if(SourcePassword) {
            filters.push(`SourcePassword LIKE '%${SourcePassword}%'`);
        }
        if(Description) {
            filters.push(`Description LIKE '%${Description}%'`);
        }
        if(EntryDate) {
            filters.push(this.getDateCondition(EntryDate, "EntryDate"));
        }
        if(StartTime) {
            filters.push(this.getDateCondition(StartTime, "StartTime"));
        }
        if(EndTime) {
            filters.push(this.getDateCondition(EndTime, "EndTime"));
        }
        if(JobEnabled) {    
            filters.push(`JobEnabled LIKE '%${JobEnabled}%'`);
        }
        if(JobPriority) {
            filters.push(`JobPriority LIKE '%${JobPriority}%'`);
        }
        if(ExtnDetails) {
            filters.push(`ExtnDetails LIKE '%${ExtnDetails}%'`);
        }
        if(ExtnType) {
            filters.push(`ExtnType LIKE '%${ExtnType}%'`);
        }

        if(filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if(searchFilters.length > 0) {
            query += ` ${filters.length > 0 ? "AND" : "WHERE"} ${searchFilters.join(" OR ")}`;
            countQuery += ` ${filters.length > 0 ? "AND" : "WHERE"} ${searchFilters.join(" OR ")}`;
        }

        if(page && limit) {
            query += ` ORDER BY JobID DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { backupLogs: result.rows, totalCount };
    }

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
        console.log("offset:::", offset);
        console.log("limitData:::", limitData);
        let query = `SELECT * FROM ${DBName}.PingPathLogs`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.PingPathLogs`;
        let otherPingPathDataQuery = `SELECT 
        SUM(CASE WHEN PingStatus = 'Success' THEN 1 ELSE 0 END) AS ping_success,
        SUM(CASE WHEN PingStatus = 'Failed' THEN 1 ELSE 0 END) AS ping_failed,
        SUM(CASE WHEN Connection = 'Success' THEN 1 ELSE 0 END) AS connection_success,
        SUM(CASE WHEN Connection = 'Skipped' THEN 1 ELSE 0 END) AS connection_failed
        FROM ${DBName}.PingPathLogs`;

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
            filters.push(this.getDateCondition(entryDateTime, "EntryDateTime"));
        }

        // Add filters to the query if any exist
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
            otherPingPathDataQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
            otherPingPathDataQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (limitData || offset) {
            console.log("offset:::", offset);
            query += ` ORDER BY Id DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const otherPingPathDataResult = await executeQuery(
            otherPingPathDataQuery
        );
        const otherPingPathData = otherPingPathDataResult.rows[0];
        const totalCount = countResult.rows[0].total_count;
        return { pingLogs: result.rows, totalCount, otherPingPathData };
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
        Username?: string,
        UserRole?: string,
        JobName?: string,
        Module?: string,
        Action?: string,
        DateTimeStamp?: string,
        LoginTime?: string,
        LogoutTime?: string
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

        if (Username) {
            filters.push(`Username LIKE '%${Username}%'`);
        }
        if (UserRole) {
            filters.push(`UserRole LIKE '%${UserRole}%'`);
        }
        if (JobName) {
            filters.push(`JobName LIKE '%${JobName}%'`);
        }
        if (Action) {
            filters.push(`Action LIKE '%${Action}%'`);
        }
        if (DateTimeStamp) {
            filters.push(this.getDateCondition(DateTimeStamp, "DateTimeStamp"));
        }
        if (LogoutTime) {
            filters.push(this.getDateCondition(LogoutTime, "LogoutTime"));
        }
        if (LoginTime) {
            filters.push(this.getDateCondition(LoginTime, "LoginTime"));
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
            query += ` ORDER BY EventID DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);
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
        startTime?: string,
        endTime?: string,
        duration?: string,
        nextRunDateTime?: string,
        jobType?: string,
        dataInKB?: string,
        dataInMB?: string,
        dataInGB?: string,
        dataInTB?: string
    ) => {
        let query = `SELECT * FROM ${DBName}.JobFireEntries`;
        let countQuery = `SELECT COUNT(*) AS total_count FROM ${DBName}.JobFireEntries`;
        let countCompleteAndFailedJobsQuery = `SELECT 
    COUNT(CASE WHEN Status = 'COMPLETED' THEN 1 END) AS CompletedJobs,
    COUNT(CASE WHEN Status = 'FAILED' THEN 1 END) AS FailedJobs,
    SUM(TRY_CAST(DataInKB AS NUMERIC)) AS TotalDataInKB,
    SUM(TRY_CAST(DataInMB AS NUMERIC)) AS TotalDataInMB,
    SUM(TRY_CAST(DataInGB AS NUMERIC)) AS TotalDataInGB,
    SUM(TRY_CAST(DataInTB AS NUMERIC)) AS TotalDataInTB
FROM  ${DBName}.JobFireEntries`;

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
            searchFilters.push(`EndTime LIKE '%${searchParameter}%'`);
            searchFilters.push(`Duration LIKE '%${searchParameter}%'`);
            searchFilters.push(`NextRunDateTime LIKE '%${searchParameter}%'`);
            searchFilters.push(`JobType LIKE '%${searchParameter}%'`);
            searchFilters.push(`DataInKB LIKE '%${searchParameter}%'`);
            searchFilters.push(`DataInMB LIKE '%${searchParameter}%'`);
            searchFilters.push(`DataInGB LIKE '%${searchParameter}%'`);
            searchFilters.push(`DataInTB LIKE '%${searchParameter}%'`);
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
            filters.push(this.getDateCondition(startTime, "StartTime"));
        }
        if (endTime) {
            filters.push(this.getDateCondition(endTime, "EndTime"));
        }
        if (duration) {
            filters.push(`Duration LIKE '%${duration}%'`);
        }
        if (nextRunDateTime) {
            filters.push(
                this.getDateCondition(nextRunDateTime, "NextRunDateTime")
            );
        }
        if (jobType) {
            filters.push(`JobType LIKE '%${jobType}%'`);
        }
        if (dataInKB) {
            filters.push(`DataInKB LIKE '%${dataInKB}%'`);
        }
        if (dataInMB) {
            filters.push(`DataInMB LIKE '%${dataInMB}%'`);
        }
        if (dataInGB) {
            filters.push(`DataInGB LIKE '%${dataInGB}%'`);
        }
        if (dataInTB) {
            filters.push(`DataInTB LIKE '%${dataInTB}%'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
            countCompleteAndFailedJobsQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`;
            countCompleteAndFailedJobsQuery += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        if (limit && page) {
            const { offset, limit: limitData } = calculatePagination(
                page,
                limit
            );
            query += ` ORDER BY EntryId DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        const countCompleteAndFailedJobsResult = await executeQuery(
            countCompleteAndFailedJobsQuery
        );
        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return {
            jobFireLogs: result.rows,
            totalCount,
            countCompleteAndFailedJobs:
                countCompleteAndFailedJobsResult.rows[0],
        };
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
            searchFilters.push(`up.ModuleName LIKE '%${searchParameter}%'`);
            // Moved STRING_AGG condition to HAVING clause
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
            filters.push(this.getDateCondition(entryDate, "u.EntryDate"));
        }
        if (password) {
            filters.push(`u.Password LIKE '%${password}%'`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
            countQuery += ` WHERE ${filters.join(" AND ")}`;
        }

        if(searchFilters.length > 0){
            query += ` WHERE ${searchFilters.join(" OR ")}`
            countQuery += ` WHERE ${searchFilters.join(" OR ")}`
        }

        

        // Add HAVING clause for searchFilters
        if (searchFilters.length > 0) {
            query += ` GROUP BY 
            u.ID,
            u.UserName,
            u.[Role],
            u.Password,
            u.Phone,
            u.Email,
            u.ProfilePicture,
            u.EntryDate`
            

        } else {
            query += ` GROUP BY 
            u.ID,
            u.UserName,
            u.[Role],
            u.Password,
            u.Phone,
            u.Email,
            u.ProfilePicture,
            u.EntryDate`;
        }

        if(moduleNames){
            query += ` HAVING STRING_AGG(up.ModuleName, ', ') LIKE '%${moduleNames}%'`
        }

        if (page && limit) {
            query += ` ORDER BY ID DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query:::", query);
        console.log("countQuery:::", countQuery);
        const result = await executeQuery(query);
        const countResult = await executeQuery(countQuery);
        const totalCount = countResult.rows[0].total_count;
        return { users: result.rows, totalCount };
    };

    // Dashboard
    getDashboard = async (DBName: string, userId: number) => {
        const jobStatusPieChartQuery = `SELECT 
    ROUND(COUNT(CASE WHEN Status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*), 2) AS CompletedJobsPercentage,
    ROUND(COUNT(CASE WHEN Status = 'FAILED' THEN 1 END) * 100.0 / COUNT(*), 2) AS FailedJobsPercentage,
    ROUND(COUNT(CASE WHEN Status = 'OTHER' THEN 1 END) * 100.0 / COUNT(*), 2) AS PartialCompletedJobsPercentage,
    COUNT(CASE WHEN Status = 'COMPLETED' THEN 1 END) AS CompletedJobsCount,
    COUNT(CASE WHEN Status = 'FAILED' THEN 1 END) AS FailedJobsCount,
    COUNT(CASE WHEN Status = 'OTHER' THEN 1 END) AS PartialCompletedJobsCount,
    COUNT(*) AS TotalJobCount 
    
        FROM 
            ${DBName}.JobFireEntries;`;
        const jobStatusPieChartResult = await executeQuery(
            jobStatusPieChartQuery
        );
        const jobStatusPieChart = jobStatusPieChartResult.rows[0];
        // Total clients
        const totalClientsQuery = `SELECT COUNT(*) AS total_clients FROM ${DBName}.Clients`;
        const totalClientsResult = await executeQuery(totalClientsQuery);
        const totalClients = totalClientsResult.rows[0].total_clients;

        // online, offline, connected, jobs
        const jobOnlineOfflineQuery = `SELECT 
    COUNT(CASE WHEN PingStatus = 'Success' AND CAST(EntryDateTime AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS success_count,
    COUNT(CASE WHEN PingStatus = 'Failed' AND CAST(EntryDateTime AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS failed_count,
        COUNT(CASE WHEN PingStatus = 'Success' AND Connection = 'Success' AND CAST(EntryDateTime AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS connectedJobCount
FROM 
    ${DBName}.PingPathLogs;`;
        const jobOnlineOfflineResult = await executeQuery(
            jobOnlineOfflineQuery
        );
        const jobOnlineOffline = jobOnlineOfflineResult.rows[0];

        // lastcupporttickets
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
        const latestSupportTicketDataResult = await executeQuery(
            latestSupportTicketDataQuery
        );
        const latestSupportTicketData = latestSupportTicketDataResult.rows;

        // supportTicket count
        const query2 = `
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
                (SELECT response_on_time_percentage FROM SupportTicketCounts) AS responseOnTimePercentage
        `;
        const supportTicketCountResult = await executeQuery(query2);
        const supportTicketCount = supportTicketCountResult.rows[0];

        // Total data backup
        const totalDataBackupQuery = `
            SELECT 
    SUM(TRY_CAST(DataInKB AS NUMERIC)) AS TotalDataInKB,
    CASE 
        WHEN SUM(TRY_CAST(DataInKB AS NUMERIC)) >= 1099511627776 THEN FORMAT(SUM(TRY_CAST(DataInKB AS NUMERIC)) / 1099511627776.0, 'N2') + ' TB'
        WHEN SUM(TRY_CAST(DataInKB AS NUMERIC)) >= 1073741824 THEN FORMAT(SUM(TRY_CAST(DataInKB AS NUMERIC)) / 1073741824.0, 'N2') + ' GB'
        WHEN SUM(TRY_CAST(DataInKB AS NUMERIC)) >= 1048576 THEN FORMAT(SUM(TRY_CAST(DataInKB AS NUMERIC)) / 1048576.0, 'N2') + ' MB'
        WHEN SUM(TRY_CAST(DataInKB AS NUMERIC)) >= 1024 THEN FORMAT(SUM(TRY_CAST(DataInKB AS NUMERIC)) / 1024.0, 'N2') + ' MB'
        ELSE FORMAT(SUM(TRY_CAST(DataInKB AS NUMERIC)), 'N2') + ' KB'
    END AS TotalDataInReadableFormat
FROM  ${DBName}.JobFireEntries`;
        const totalDataBackupResult = await executeQuery(totalDataBackupQuery);
        const totalDataBackup = totalDataBackupResult.rows[0];

        // user banner
        const bannerQuery = `SELECT * FROM ClientWebsiteBanners WHERE user_id = ${userId}`;
        const bannerResult = await executeQuery(bannerQuery);
        const banner = bannerResult.rows;
        // add path to banner
        let fullImagePath = null;
        if (banner && banner.length > 0 && banner[0]) {
            const relativePath = formateFrontImagePath(banner[0].imagePath);
            fullImagePath = relativePath
                ? `${getEnvVar("LOCAL_URL")}/${banner[0].imagePath}`
                : null;
        }

        return {
            jobStatusPieChart,
            totalClients,
            jobOnlineOffline,
            supportTicketCount,
            latestSupportTicketData,
            totalDataBackup,
            banner: fullImagePath,
        };
    };

    getRepostFromDashboard = async (
        DBName: string,
        userId: number,
        reportType: string,
        from_date: string,
        to_date: string
    ) => {
        let query = `SELECT * FROM ${DBName}.${reportType}`;

        // Add conditional filtering based on DBName
        if (reportType === "BackupSSLogs") {
            query += ` WHERE EntryDateTime >= '${from_date}' AND EntryDateTime <= '${to_date}'`;
        } else if (reportType === "AuditTrail") {
            query += ` WHERE DateTimeStamp >= '${from_date}' AND DateTimeStamp <= '${to_date}'`;
        } else if (reportType === "PingPathLogs") {
            query += ` WHERE EntryDateTime >= '${from_date}' AND EntryDateTime <= '${to_date}'`;
        } else if (reportType === "JobFireEntries") {
            query += ` WHERE StartTime >= '${from_date}' AND StartTime <= '${to_date}'`;
        }
        const result = await executeQuery(query);
        return result.rows;
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
            loginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            databaseName: databaseName,
            login_type: login_type,
        };
        return {
            authorization_token: this.jwtService.generateToken(jwtTokenPayload),
            user_id: userId,
        };
    };

    // Setting
    getSetting = async (DBName: string, userId: number) => {
        const query = `SELECT * FROM ${DBName}.CompanyProfile`;
        const companyDetails = `select * from Licenses where user_id = ${userId}`;
        const result = await executeQuery(query);
        const companyDetailsResult = await executeQuery(companyDetails);
        return { ...companyDetailsResult.rows[0], ...result.rows[0] };
    };

    // Software Status
    getSoftwareStatus = async (DBName: string) => {
        const query = `SELECT TOP 1
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
    ${DBName}.JobFireEntries jfe
ORDER BY 
    jfe.StartTime DESC;`;
        const result = await executeQuery(query);
        return result.rows[0];
    };

    getMyNotifications = async (DBName: string, userId: number) => {
        const query1 = `SELECT un.id as notificationId, n.Title, n.MessageBody, n.CreatedAt, un.SentAt as notificationCreatedAt, un.IsRead, un.ExpireDate FROM UsersNotifications un LEFT JOIN Notifications n ON un.NotificationId = n.id WHERE UserId = ${userId} order by un.id DESC`;
        const result1 = await executeQuery(query1);

        const query2 = `SELECT COUNT(*) FROM UsersNotifications WHERE UserId = ${userId} AND IsRead = 0`;
        const result2 = await executeQuery(query2);
        return { isAllNotificationRead: result2.rows[0][""] == 0 ? true : false, notifications: result1.rows };
    };

    markAllRead = async (userId: number) => {
        const query = `UPDATE UsersNotifications SET IsRead = 1 WHERE UserId = ${userId}`;
        const result = await executeQuery(query);
        return result.rows;
    };

    // Plan listing
    getPlanListing = async (userId: number) => {
        

        // Currrent user subscription plan
        const currentUserSubscriptionPlanQuery = `SELECT * FROM Subscription WHERE userId = ${userId} and status = 'active'`;
        const currentUserSubscriptionPlanResult = await executeQuery(
            currentUserSubscriptionPlanQuery
        );
        const currentUserSubscriptionPlan =
            currentUserSubscriptionPlanResult.rows[0];

        let query;

        if (currentUserSubscriptionPlan) {
            query = `SELECT * FROM Plans WHERE id = ${currentUserSubscriptionPlan.planId} OR deletedAt IS NULL`;
        } else {
            query = `SELECT * FROM Plans WHERE deletedAt IS NULL`;
        }

        const plans = await executeQuery(query);
        return { plans: plans.rows, currentUserSubscriptionPlan };
    };

    getFaq = async () => {
        const query = `SELECT * FROM FAQ`;
        const result = await executeQuery(query);
        return result.rows;
    };

    // Email Configration
    getEmailConfiguration = async (userId: number) => {
        const query = `SELECT * FROM EmailConfig WHERE UserId = ${userId}`;
        const result = await executeQuery(query);
        return result.rows;
    };

    updateEmailConfiguration = async (
        DBName: string,
        userId: number,
        body: any
    ) => {
        // Find is this user email config is exit then update else create
        const isExitQuery = `SELECT * FROM EmailConfig WHERE UserId = ${userId}`;
        const isExitResult = await executeQuery(isExitQuery);
        if (isExitResult.rows.length > 0) {
            const updateQuery = `UPDATE EmailConfig SET SmtpServer = '${body.SmtpServer}', SmtpPort = '${body.SmtpPort}', SenderEmail = '${body.SenderEmail}', Password = '${body.Password}', EnableTLS = '${body.EnableTLS}' WHERE UserId = ${userId}`;
            const updateResult = await executeQuery(updateQuery);
            return updateResult.rows;
        }

        const query = `INSERT INTO EmailConfig (UserId, SmtpServer, SmtpPort, SenderEmail, Password, EnableTLS) VALUES (${userId}, '${body.SmtpServer}', '${body.SmtpPort}', '${body.SenderEmail}', '${body.Password}', '${body.EnableTLS}')`;
        const result = await executeQuery(query);
        return result.rows;
    };

    createEmailSchedule = async (DBName: string, userId: number, body: any) => {
        const isEmailInstant = body.Type === "instant";
        const query = `INSERT INTO EmailSchedule (UserId, ReportName, Type, EmailTo, Subject, Body${isEmailInstant ? ",LastRunDate" : ""}) VALUES (${userId}, '${body.ReportName}', '${body.Type}', '${body.EmailTo}', '${body.Subject}', '${body.Body}'${isEmailInstant ? `, GETDATE()` : ""})`;
        await executeQuery(query);

        if (isEmailInstant) {
            this.instantEmailSchedule(DBName, userId, body);
        }

        return true;

        // return result.rows;
    };

    sendEmail = async (id: number, userId: number, DBName: string) => {
        const query = `SELECT * FROM EmailSchedule WHERE Id = ${id} AND UserId = ${userId}`;
        const result = await executeQuery(query);
        const emailSchedule = result.rows[0];
        console.log("emailSchedule", emailSchedule);
        this.instantEmailSchedule(DBName, userId, emailSchedule);
        return true;
    }

    updateEmailSchedule = async (DBName: string, userId: number, body: any) => {
        const isEmailInstant = body.Type === "instant";
        // body.EmailTo is coming in comma saprated value I want to remove extra space
        const emailTo = body.EmailTo.split(",")
            .map((email: string) => email.trim())
            .join(",");
        const reportName = body.ReportName.split(",")
            .map((report: string) => report.trim())
            .join(",");
        const query = `UPDATE EmailSchedule SET ReportName = '${reportName}', Type = '${body.Type}', EmailTo = '${emailTo}', Subject = '${body.Subject}', Body = '${body.Body}'${isEmailInstant ? `, LastRunDate = GETDATE()` : ""} WHERE Id = ${body.id}`;

        await executeQuery(query);
        if (isEmailInstant) {
            this.instantEmailSchedule(DBName, userId, body);
        }

        return true;
    };

    deleteEmailSchedule = async (id: number) => {
        const query = `DELETE FROM EmailSchedule WHERE Id = ${id};`;
        await executeQuery(query);
        return true;
    };

    getEmailSchedule = async (page: number, limit: number, userId: number) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM EmailSchedule WHERE UserId = ${userId}`;
        if (page && limit) {
            query += ` ORDER BY CreatedAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const totalQuery = `SELECT COUNT(*) FROM EmailSchedule WHERE UserId = ${userId}`;
        const result = await executeQuery(query);
        const totalResult = await executeQuery(totalQuery);
        return {
            emailSchedule: result.rows,
            totalCount: totalResult.rows[0][""],
        };
    };

    private instantEmailSchedule = async (
        DBName: string,
        userId: number,
        body: any
    ) => {
        // Make csv file for each report and save into attachmentPaths and send email to users

        const emailConfig = await this.getEmailConfiguration(userId);
        console.log("emailConfig_____________", emailConfig);
        const attachmentPaths = [];

        // split the ReportName by space and get the first word
        const reportNames = body.ReportName.split(",")
            .map((report: string) => report.trim())
            .join(",")
            .split(",");
        console.log("reportNames", reportNames);
        for (const reportName of reportNames) {
            let query = `SELECT * FROM ${DBName}.${reportName}`;
            if (reportName === "Clients" || reportName === "BackupJobs") {
            } else {
                if (reportName === "BackupSSLogs") {
                    query += ` WHERE EntryDateTime >= CAST(GETDATE() AS DATE) AND EntryDateTime < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
                } else if (reportName === "AuditTrail") {
                    query += ` WHERE DateTimeStamp >= CAST(GETDATE() AS DATE) AND DateTimeStamp < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
                } else if (reportName === "PingPathLogs") {
                    query += ` WHERE EntryDateTime >= CAST(GETDATE() AS DATE) AND EntryDateTime < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
                } else if (reportName === "JobFireEntries") {
                    query += ` WHERE StartTime >= CAST(GETDATE() AS DATE) AND StartTime < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`;
                }
            }
            console.log("query", query);
            const result = await executeQuery(query);
            console.log("result", result);
            const csvFilePath = await this.generateCSVFile(
                reportName,
                result.rows
            );
            console.log("csvFilePath", csvFilePath);
            attachmentPaths.push({
                fileName: csvFilePath.fileName,
                path: csvFilePath.filePath,
            });
        }

        // Send email to users
        const email = body.EmailTo;
        const subject = body.Subject;
        const text = body.Body;
        await sendMultipleCsvToMail(
            email,
            subject,
            text,
            attachmentPaths,
            emailConfig[0].SenderEmail,
            emailConfig[0].Password
        );
        // return attachmentPaths;
    };

    private async generateCSVFile(
        reportName: string,
        data: any[]
    ): Promise<{ fileName: string; filePath: string }> {
        // Add headers from the keys of the first object in the data array
        const headers = Object.keys(data[0]).join(","); // Get headers from the first row
        const csv = [
            headers,
            ...data.map((row) => Object.values(row).join(",")),
        ].join("\n"); // Combine headers with data
        const fileName = `${reportName}-${moment().format("YYYY-MM-DD HH:mm:ss")}.csv`;
        const filePath = `assets/emailCsv/${fileName}`; // Define your path here
        // Ensure the directory exists
        await fs.promises.mkdir("assets/emailCsv", { recursive: true }); // Create directory if it doesn't exist

        await fs.promises.writeFile(filePath, csv);
        return {
            fileName,
            filePath,
        };
    }

    // Feedback and suggestion
    createFeedbackAndSuggestion = async (
        DBName: string,
        userId: number,
        body: any,
        file: any
    ) => {
        const filePath = file ? file.path : null;
        const mimeType = file ? file.mimetype : null;
        const query = `INSERT INTO FeedbackAndSuggestion (UserId, Username, Email, Subject, Type, Message, Image, MimeType ) VALUES (${userId}, '${body.Username}', '${body.Email}', '${body.Subject}', '${body.Type}', '${body.Message}', ${filePath ? `'${filePath}'` : null}, ${mimeType ? `'${mimeType}'` : null})`;
        const result = await executeQuery(query);
        return result.rows;
    };

    getFeedbackAndSuggestion = async (
        page: number,
        limit: number,
        userId: number
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM FeedbackAndSuggestion WHERE UserId = ${userId}`;
        const totalQuery = `SELECT COUNT(*) FROM FeedbackAndSuggestion WHERE UserId = ${userId}`;

        if (page && limit) {
            query += ` ORDER BY CreatedAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }

        console.log("query", query);
        const result = await executeQuery(query);

        const changeImagesPath = (imagePath: string) => {
            if (!imagePath) return null;
            const relativePath = formateFrontImagePath(imagePath);
            return `${getEnvVar("LOCAL_URL")}/${imagePath}`;
        };

        const feedbackAndSuggestion = result.rows.map((item: any) => {
            return {
                ...item,
                Image:
                    item.Image !== null ? changeImagesPath(item.Image) : null, // TODO
            };
        });
        const totalResult = await executeQuery(totalQuery);
        return { feedbackAndSuggestion, totalCount: totalResult.rows[0][""] };
    };

    // Notification count
    getNotificationCount = async (userId: number) => {
        const query = `SELECT COUNT(*) FROM UsersNotifications WHERE UserId = ${userId} AND IsRead = 0`;
        const result = await executeQuery(query);
        return { isAllNotificationRead: result.rows[0][""] > 0 ? false : true };
    }

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
}
