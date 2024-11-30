import Joi from "joi";

export const getAllSupportTicketRequest = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    isExportToEmail: Joi.string().optional(),
    recipientEmail: Joi.string().optional(),
});