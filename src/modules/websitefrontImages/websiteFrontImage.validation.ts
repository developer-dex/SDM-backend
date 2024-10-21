import Joi from "joi";

export const getFrontImageValidation = Joi.object({
    category: Joi.string().required().messages({
        "any.required": "category is required",
    }),
});
