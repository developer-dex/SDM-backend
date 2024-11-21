
import Joi from "joi";


export const paginationRequest = Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    searchParameter: Joi.string().optional(),
});


export const createSupportTicketRequest = Joi.object({
    topic: Joi.string().required(),
    status: Joi.string().required(),
});