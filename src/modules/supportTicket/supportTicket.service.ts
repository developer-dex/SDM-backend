import { Model } from "mongoose";
import SupportTicket from "../../models/SupportTicket";
import {
    executeQuery,
    executeSqlQuery,
    retrieveData,
} from "../../config/databaseConfig";
import { Actions } from "../../helpers/constants";
import { Modules } from "../../helpers/constants";
import { createAuditTrail } from "../../common/function";
import { calculatePagination, createCsvFile } from "../../helpers/util";
import sendCsvToMail from "../../helpers/sendMail";

export class SupportTicketService {
    constructor() {}

    createSupportTicket = async (userId: string, requestData: any) => {
        const query = `INSERT INTO SuperAdmin.dbo.SupportTickets (userId, topic, status) VALUES ('${userId}', '${requestData.topic}', 'PENDING')`;
        return await executeQuery(query);
    };

    getSupportTicket = async (
        userId?: string,
        page?: number,
        limit?: number
    ) => {
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
            supportTickets: supportTicketData.rows,
        };
    };

    getAllSupportTicket = async (
        page: number,
        limit: number,
        isExportToEmail?: boolean,
        recipientEmail?: string,
        searchParameter?: string,
        createdAt?: string,
        Topic?: string,
        status?: string,
        endTime?: string,
        is_on_time?: string
    ) => {
        const { offset, limit: limitData } = calculatePagination(page, limit);
        let query = `SELECT * FROM SupportTickets`;
        if (offset && limitData) {
            query += `ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limitData} ROWS ONLY`;
        }
        const totalCountQuery = `SELECT COUNT(*) FROM SupportTickets`;

        const filters = [];
        const searchFilters = [];

        if (searchParameter) {
            searchFilters.push(`Topic LIKE '%${searchParameter}%'`);
            searchFilters.push(`status LIKE '%${searchParameter}%'`);
            searchFilters.push(`createdAt LIKE '%${searchParameter}%'`);
            searchFilters.push(`end_time LIKE '%${searchParameter}%'`);
            searchFilters.push(`is_on_time LIKE '%${searchParameter}%'`);
        }
        if (status) {
            filters.push(`status = '${status}'`);
        }
        if (Topic) {
            searchFilters.push(`topic LIKE '%${Topic}%'`);
        }
        if (createdAt) {
            filters.push(this.getDateCondition(createdAt, "created_at"));
        }
        if (endTime) {
            filters.push(this.getDateCondition(endTime, "end_time"));
        }
        if (is_on_time) {
            filters.push(`is_on_time = ${is_on_time}`);
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(" AND ")}`;
        }
        if (searchFilters.length > 0) {
            query += ` WHERE ${searchFilters.join(" OR ")}`;
        }

        const totalCount = await executeQuery(totalCountQuery);
        const supportTicketData = await executeQuery(query);

        if (isExportToEmail) {
            const header = [
                { id: "id", title: "ID" },
                { id: "userId", title: "User ID" },
                { id: "Topic", title: "Topic" },
                { id: "status", title: "Status" },
                { id: "start_time", title: "Start Time" },
                { id: "end_time", title: "End Time" },
                { id: "Take_time_in_hr", title: "How much take time in Hr" },
                { id: "is_on_time", title: "Is on time" },
                { id: "solved_status_time", title: "Solved Status Time" },
                { id: "createdAt", title: "Ticket Created At" },
            ];
            const path = await createCsvFile(supportTicketData.rows, header);
            await sendCsvToMail(
                recipientEmail,
                "Support Tickets CSV",
                "Please find the attached CSV file of support tickets.",
                path,
                "support_tickets.csv"
            );
        }
        return {
            data: supportTicketData.rows,
            totalCount: totalCount.rows[0].count,
        };
    };

    changeSupportTicketStatus = async (
        requestData: any,
        token_payload: any
    ) => {
        const existTicketInfoQuery = `SELECT * FROM SupportTickets WHERE id = ${requestData.id}`;
        const existTicketInfo = await executeQuery(existTicketInfoQuery);

        let updateSet = `status = '${requestData.status}'`;
        let isOnTime = false;

        if (requestData.status.toLowerCase() === "ongoing") {
            updateSet += `, start_time = GETDATE(), take_time_in_hr = ${requestData.take_time_in_hr}`;
        } else if (requestData.status.toLowerCase() === "solved") {
            const timeTakenInHours =
                (new Date().getTime() -
                    new Date(existTicketInfo.rows[0].start_time).getTime()) /
                (1000 * 60 * 60);
            isOnTime =
                timeTakenInHours <= existTicketInfo.rows[0].take_time_in_hr;
            updateSet += `, end_time = GETDATE(), is_on_time = ${isOnTime === true ? 1 : 0}`;
        }

        const updateQuery = `UPDATE SupportTickets SET ${updateSet} WHERE id = ${requestData.id}`;
        if (token_payload.login_type && token_payload.login_type === "admin") {
            const data = {
                id: token_payload.id,
                username: token_payload.username,
                loginTime: new Date().toISOString(),
                role: token_payload.role,
                module: Modules.SUPPORT_TICKET,
                action: Actions.SUPPORT_TICKET.UPDATE,
            };
            await createAuditTrail(data);
        }
        return await executeQuery(updateQuery);
    };

    // Function to convert special date strings to SQL date conditions
    private getDateCondition(dateString: string, field: string): string {
        const today = new Date();
        let condition = "";

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
