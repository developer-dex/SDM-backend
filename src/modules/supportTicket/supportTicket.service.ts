import { Model } from "mongoose";
import SupportTicket from "../../models/SupportTicket";
import { executeQuery, executeSqlQuery, retrieveData } from "../../config/databaseConfig";

export class SupportTicketService {
    constructor() {}

    createSupportTicket = async (userId: string, requestData: any) => {
        const query = `INSERT INTO SuperAdmin.dbo.SupportTickets (userId, topic, status) VALUES ('${userId}', '${requestData.topic}', '${requestData.status}')`;
        return await executeSqlQuery(query);
    };

    getSupportTicket = async (userId?: string) => {
        let query = `SELECT 
    st.*, 
    u.full_name, 
    u.email
FROM 
    SuperAdmin.dbo.SupportTickets st
JOIN 
    SuperAdmin.dbo.Users u ON st.userId = u.id; `;
        if (userId) {
            query += `WHERE st.userId = '${userId}'`;
        }
        const supportTicketData = await retrieveData(query);
        return supportTicketData;
    };

    getAllSupportTicket = async () => {
        const query = `SELECT * FROM SupportTickets`;
        const supportTicketData = await executeQuery(query);
        return {
            totalCount: supportTicketData.rows.length,
            data: supportTicketData.rows
        };
    };

    changeSupportTicketStatus = async (requestData: any) => {
        const updateQuery = `UPDATE SupportTickets SET status = '${requestData.status}' WHERE id = ${requestData.id}`;
        return await executeSqlQuery(updateQuery);
    };
}
