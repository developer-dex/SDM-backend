
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
});


export const createSupportTicketRequest = Joi.object({
    topic: Joi.string().required(),
});

export const pagination = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
});