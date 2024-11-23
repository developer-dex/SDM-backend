import Joi from "joi";

export const createPlanRequest = Joi.object({
    period: Joi.string()
        .valid("daily", "weekly", "monthly", "yearly")
        .required()
        .messages({
            "any.required": "Period is required",
            "string.base": "Period must be a string",
            "any.only":
                'Period must be one of "daily", "weekly", "monthly", or "yearly"',
        }),

    interval: Joi.number().integer().min(1).required().messages({
        "any.required": "Interval is required",
        "number.base": "Interval must be a number",
        "number.min": "Interval must be at least 1",
    }),

    itemName: Joi.string().trim().required().messages({
        "any.required": "Item name is required",
        "string.base": "Item name must be a string",
    }),

    amount: Joi.number().positive().required().messages({
        "any.required": "Amount is required",
        "number.base": "Amount must be a number",
        "number.positive": "Amount must be greater than zero",
    }),

    currency: Joi.string()
        .valid("INR", "USD", "EUR") // Add other currencies as needed
        .required()
        .messages({
            "any.required": "Currency is required",
            "string.base": "Currency must be a string",
            "any.only": 'Currency must be one of "INR", "USD", or "EUR"',
        }),
});

export const listingPlanRequest = Joi.object({
    isAdminSide: Joi.boolean().required().messages({
        "any.required": "isAdminSide is required",
        "boolean.base": "isAdminSide must be a boolean",
    }),
});


export const getAllLicensesRequest = Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    searchParameter: Joi.string().optional(),
});