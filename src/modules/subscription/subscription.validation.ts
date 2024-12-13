import Joi from "joi";


const subscriptionSuccessRequest = Joi.object({
    orderId: Joi.string().required(),
});

export { subscriptionSuccessRequest };