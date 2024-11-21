import { ESupportTicketStatus } from "../../common/common.enum";

export interface paginationRequeset {
    page: string;
    limit: string;
    searchParameter?: string;
}

export interface createSupportTicketRequest {
    topic: string;
    status: ESupportTicketStatus;
}