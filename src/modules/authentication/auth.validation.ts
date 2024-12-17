import Joi from "joi";

export const loginRequestSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).required(),
    // mobile: Joi.string().optional(),
    // login_type: Joi.string().required(),
});

export const signupRequestSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().required(),
    mobileNumber: Joi.string().required(),
});

export const forgetPasswordRequestSchema = Joi.object({
    email: Joi.string().email().required(),
});


export const resetPasswordRequestSchema = Joi.object({
    new_password: Joi.string().min(8).required(),
    confirm_password: Joi.string().min(8).required(),
    reset_password_token: Joi.string().required(),
}).with('new_password', 'confirm_password').custom((value, helpers) => {
    if (value.new_password === value.confirm_password) {
        return value;
    }
    return helpers.error('any.invalid', { message: 'New Passwords and Confirm Password do not match' });
});
