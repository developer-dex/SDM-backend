import Joi from "joi";


export const getAllClientsRequest = Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    searchParameter: Joi.string().optional(),
});

export const changeNotificationStatusRequest = Joi.object({
    notificationId: Joi.number().required(),
    status: Joi.number().required(),
});

export const addOrUpdateClientRequest = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().required(),
    permissions: Joi.string().required(),
    phoneNo: Joi.string().required(),
});

export const updateClientRequest = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().required(),
    permissions: Joi.string().required(),
    phoneNo: Joi.string().required(),
});