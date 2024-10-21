import Joi from "joi";

export const contactUsRequest = Joi.object({
    name: Joi.string().required(),
    phoneNo: Joi.string().trim().required(),
    email: Joi.string().email().trim().lowercase().required(),
    subject: Joi.string().trim().optional(),
    message: Joi.string().required(),
});
