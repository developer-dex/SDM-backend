import { executeSqlQuery, retrieveData } from "../../config/databaseConfig";
import { calculatePagination } from "../../helpers/util";

export class ClientAdminService {
    constructor() {}

    getBackupSS = async (DBName: string, page: number, limit: number) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        const query = `SELECT * FROM ${DBName}.BackupSSLogs LIMIT ${limitData} OFFSET ${offset}`;
        const result = await retrieveData(query);
        return result;
    };

    getBackupSSCounts = async (
        DBName: string
    ) => {
        const query = `SELECT COUNT(*) AS total_count FROM ${DBName}.BackupSSLogs`;
        const result = await retrieveData(query);
        return result;
    };

    getPingAndPath = async (DBName: string, page: number, limit: number) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        const query = `SELECT * FROM ${DBName}.PingPathLogs LIMIT ${limitData} OFFSET ${offset}`;
        const result = await retrieveData(query);
        return result;
    };

    getPingAndPathCounts = async (
        DBName: string
    ) => {
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
        searchParameter?: string
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM ${DBName}.AuditTrail`;
        if (searchParameter) {
            query += `WHERE Username LIKE '%${searchParameter}%' OR jobName LIKE '%${searchParameter}%' OR Action LIKE '%${searchParameter}%' OR OldValue LIKE '%${searchParameter}%' OR NewValue LIKE '%${searchParameter}%'`;
        }
        query += `LIMIT ${limitData} OFFSET ${offset}`;

        const result = await retrieveData(query);
        return result;
    };

    // User management
    getUsersList = async (
        DBName: string,
        page: number,
        limit: number,
        searchParameter?: string
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
    ${DBName}.dbo.Users u
LEFT JOIN 
    ${DBName}.dbo.UserPermissions up ON u.ID = up.UserID
GROUP BY 
    u.ID, 
    u.UserName, 
    u.[Role], 
    u.Password, 
    u.Phone, 
    u.Email, 
    u.ProfilePicture, 
    u.EntryDate`;
        if (searchParameter) {
            query += `WHERE u.UserName LIKE '%${searchParameter}%' OR u.Email LIKE '%${searchParameter}%'`;
        }
        query += `LIMIT ${limitData} OFFSET ${offset}`;
        const result = await retrieveData(query);
        return result;
    };
}
