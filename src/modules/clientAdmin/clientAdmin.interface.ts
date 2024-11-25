import { ESupportTicketStatus } from "../../common/common.enum";

export interface paginationRequeset {
    page: string;
    limit: string;
    searchParameter?: string;
    jobName?: string;
    jobGroup?: string;
    backupType?: string;
    sourceIp?: string;
    sourceFolder?: string;
    sourceUsername?: string;
    sourcePassword?: string;
    description?: string;
    username?: string;
    email?: string;
    role?: string;
    phone?: string;
    entryDate?: string;
    moduleNames?: string;
    password?: string;

    
}

export interface createSupportTicketRequest {
    topic: string;
}
