import { ESupportTicketStatus } from "../../common/common.enum";

export interface paginationRequeset {
    page: string;
    limit: string;
    searchParameter?: string;
    jobName?: string;
    ipMachine?: string;
    sharedPath?: string;
    pingStatus?: string;
    connection?: string;
    errors?: string;
    entryDateTime?: string;
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
    jobGroup?: string;
    backupType?: string;
    destinationFolder?: string;
    status?: string;
    startTime?: string;
    action?: string;
    oldValue?: string;
    NewValue?: string;
    Username?: string;
    UserRole?: string;
    JobName?: string;
    Module?: string;
    Action?: string;
    DateTimeStamp?: string;
    LoginTime?: string;
    LogoutTime?: string;
    ClientFolderName?: string;
    ClientData?: string;
    BaseFolderName?: string;
    BaseFolderData?: string;
    Difference?: string;
    Status?: string;
    EntryDateTime?: string;
    endTime?: string;
    duration?: string;
    nextRunDateTime?: string;
    jobType?: string;
    dataInKB?: string;
    dataInMB?: string;
    dataInGB?: string;
    dataInTB?: string; 
}

export interface createSupportTicketRequest {
    topic: string;
}
