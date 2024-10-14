import Joi from "joi";

export const scheduleDemoRequest = Joi.object({
    fullName: Joi.string().required(),
    phoneNo: Joi.string().trim().required(),
    emailAddress: Joi.string().email().trim().lowercase().required(),
    companyName: Joi.string().trim().required(),
    jobTitle: Joi.string().trim().optional(),
    industry: Joi.string().required(),
    companySize: Joi.number().required(),
    preferredDate: Joi.date().iso().required(),
    preferredTime: Joi.string().required(),
});
