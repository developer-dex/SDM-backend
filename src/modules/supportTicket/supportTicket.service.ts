import { Model } from "mongoose";
import SupportTicket from "../../models/SupportTicket";
import { executeQuery, executeSqlQuery, retrieveData } from "../../config/databaseConfig";
import { Actions } from "../../helpers/constants";
import { Modules } from "../../helpers/constants";
import { createAuditTrail } from "../../common/function";
import { calculatePagination } from "../../helpers/util";

export class SupportTicketService {
    constructor() {}

    createSupportTicket = async (userId: string, requestData: any) => {
        const query = `INSERT INTO SuperAdmin.dbo.SupportTickets (userId, topic, status) VALUES ('${userId}', '${requestData.topic}', 'PENDING')`;
        return await executeQuery(query);
    };

    getSupportTicket = async (userId?: string, page?: number, limit?: number) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT 
    st.*, 
    u.full_name, 
    u.email
FROM 
    SuperAdmin.dbo.SupportTickets st
JOIN 
    SuperAdmin.dbo.Users u ON st.userId = u.id `;
        if (userId) {
            query += `WHERE st.userId = ${userId}`;
        }
        const totalCount = await executeQuery(query);
        if (offset && limitData) {
            query += `ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        
        const supportTicketData = await executeQuery(query);
        return {
            totalCount: totalCount.rows.length,
            supportTickets: supportTicketData.rows
        };
    };

    getAllSupportTicket = async () => {
        const query = `SELECT * FROM SupportTickets`;
        const supportTicketData = await executeQuery(query);
        return {
            totalCount: supportTicketData.rows.length,
            data: supportTicketData.rows
        };
    };

    changeSupportTicketStatus = async (requestData: any, token_payload: any) => {

        const existTicketInfoQuery = `SELECT * FROM SupportTickets WHERE id = ${requestData.id}`;
        const existTicketInfo = await executeQuery(existTicketInfoQuery);
       
        let updateSet = `status = '${requestData.status}'`;
        let isOnTime = false;

        if (requestData.status.toLowerCase() === "ongoing") {
            updateSet += `, start_time = GETDATE(), take_time_in_hr = ${requestData.take_time_in_hr}`;
        } else if (requestData.status.toLowerCase() === "solved") {
            
            const timeTakenInHours = (new Date().getTime() - new Date(existTicketInfo.rows[0].start_time).getTime()) / (1000 * 60 * 60);
            isOnTime = timeTakenInHours <= existTicketInfo.rows[0].take_time_in_hr;
            updateSet += `, end_time = GETDATE(), is_on_time = ${isOnTime===true ? 1 : 0}`;
        }

        const updateQuery = `UPDATE SupportTickets SET ${updateSet} WHERE id = ${requestData.id}`;
        if(token_payload.login_type && token_payload.login_type === "admin") {
            const data = {
                id: token_payload.id,
                username: token_payload.username,
                loginTime: new Date().toISOString(),
                role: token_payload.role,
                module: Modules.SUPPORT_TICKET,
                action: Actions.SUPPORT_TICKET.UPDATE,
            }
            await createAuditTrail(data);
        }
        return await executeQuery(updateQuery);
    };
}
