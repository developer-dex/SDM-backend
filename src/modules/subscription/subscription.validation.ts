import Joi from "joi";


const subscriptionSuccessRequest = Joi.object({
    orderId: Joi.string().required(),
    userId: Joi.string().required(),
    planId: Joi.string().required(),
});

export { subscriptionSuccessRequest };