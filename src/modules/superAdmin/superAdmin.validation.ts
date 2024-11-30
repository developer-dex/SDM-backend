import Joi from "joi";

export const getAllusersRequest = Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    searchParameter: Joi.string().optional(),
    isExportToEmail: Joi.string().optional(),
    recipientEmail: Joi.string().optional(),
});

export const changeNotificationStatusRequest = Joi.object({
    notificationId: Joi.number().required(),
    status: Joi.number().required(),
});

export const addOrUpdateClientRequest = Joi.object({
    user_id: Joi.number().optional(),
    full_name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().required(),
    permissions: Joi.string().required(),
    phoneNo: Joi.string().required(),
});

export const updateUserRequest = Joi.object({
    full_name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().required(),
    permissions: Joi.string().required(),
    phoneNo: Joi.string().required(),
});

export const deleteClientRequest = Joi.object({
    userId: Joi.string().required(),
});

export const getAllClientsRequest = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    searchParameter: Joi.string().optional(),
    company_name: Joi.string().optional(),
    address: Joi.string().optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional(),
    payment_method: Joi.string().optional(),
    status: Joi.string().optional(),
    isExportToEmail: Joi.string().optional(),
    recipientEmail: Joi.string().optional(),
});

export const createClientRequest = Joi.object({
    company_name: Joi.string().required(),
    company_address: Joi.string().required(),
    payment_method: Joi.string().required(),
    gst_number: Joi.string().required(),
    pan_number: Joi.string().required(),
    industry_type: Joi.string().required(),
    company_id: Joi.string().required(),
    status: Joi.string().required(),
    plan_type: Joi.string().required(),
    cost: Joi.number().required(),
    user_id: Joi.number().required(),
    id: Joi.number().optional(),
});

export const listingPlanRequest = Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
});

export const createLicenseRequest = Joi.object({
    // license_id: Joi.string().optional(),
    user_id: Joi.string().required(),
    issue_date: Joi.string().required(),
    expiry_date: Joi.string().required(),
    // license_type: Joi.string().required(),
    status: Joi.string().required(),
    // company_id: Joi.string().required(),
    // company_name: Joi.string().required(),
    // company_pan: Joi.string().required(),
});

export const deleteLicenseRequest = Joi.object({
    licenseId: Joi.string().required(),
});


export const deleteSupportTicketTitleRequest = Joi.object({
    titleId: Joi.string().required(),
});

export const addSupportTicketTitleRequest = Joi.object({
    title: Joi.string().required(),
});

export const updateSupportTicketTitleRequest = Joi.object({
    title: Joi.string().required(),
    titleId: Joi.number().required(),
});

export const exportCsvRequest = Joi.object({
    email: Joi.string().required(),
});