import Joi from "joi";


export const paginationRequest = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    searchParameter: Joi.string().optional(),
    username: Joi.string().optional(),
    email: Joi.string().optional(),
    role: Joi.string().optional(),
    phone: Joi.string().optional(),
    entryDate: Joi.string().optional(),
    moduleNames: Joi.string().optional(),
    password: Joi.string().optional(),
    jobName: Joi.string().optional(),
    jobGroup: Joi.string().optional(),
    backupType: Joi.string().optional(),
    sourceIp: Joi.string().optional(),
    sourceFolder: Joi.string().optional(),
    sourceUsername: Joi.string().optional(),
    sourcePassword: Joi.string().optional(),
    Username: Joi.string().optional(),
    UserRole: Joi.string().optional(),
    JobName: Joi.string().optional(),
    Module: Joi.string().optional(),
    Action: Joi.string().optional(),
    DateTimeStamp: Joi.string().optional(),
    LoginTime: Joi.string().optional(),
    LogoutTime: Joi.string().optional(),
    entryDateTime: Joi.string().optional(),
    ipMachine: Joi.string().optional(),
    sharedPath: Joi.string().optional(),
    pingStatus: Joi.string().optional(),
    connection: Joi.string().optional(),
    errors: Joi.string().optional(),
    destinationFolder: Joi.string().optional(),
    status: Joi.string().optional(),
    ClientFolderName: Joi.string().optional(),
    ClientData: Joi.string().optional(),
    BaseFolderName: Joi.string().optional(),
    BaseFolderData: Joi.string().optional(),
    Difference: Joi.string().optional(),
    Status: Joi.string().optional(),
    EntryDateTime: Joi.string().optional(),
});


export const createSupportTicketRequest = Joi.object({
    topic: Joi.string().required(),
});

export const pagination = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
});

export const updateSupportTicketRequest = Joi.object({
    id: Joi.number().required(),
    status: Joi.string().required(),
});

export const reportFromDashboardRequest = Joi.object({
    reportType: Joi.string().valid('Clients', 'BackupSSLogs', 'AuditTrail', 'PingPathLogs', 'JobFireEntries').required(),
    from_date: Joi.string().required(),
    to_date: Joi.string().required()
});
