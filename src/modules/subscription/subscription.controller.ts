import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { SubscriptionService } from "./subscription.service";
import Subscription from "../../models/Subscription";
import webhooks from "razorpay/dist/types/webhooks";

export class SubscriptionController {
    private responseService: ResponseService;
    private subscriptionService: SubscriptionService;

    constructor() {
        this.responseService = new ResponseService();
        this.subscriptionService = new SubscriptionService();
    }

    createSubscription = async (
        req: Request & { token_payload?: any },
        res: Response,
        next: NextFunction
    ) => {
        const requestData = req.body;
        const token_payload = req.token_payload;
        console.log("token_payload", token_payload);
        try {
            const subscriptionData =
                await this.subscriptionService.createSubscription(requestData.planId, token_payload.data._id) ;
            return res
                .status(200)
                .send(
                    this.responseService.responseWithData(
                        true,
                        StatusCodes.OK,
                        "Subscription created successfully",
                        subscriptionData
                    )
                );
        } catch (error) {
            console.log("subscription ERROR", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };

    handleSubscriptionWebhook = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const webhookData = req.body;

            // Verify the webhook signature or authenticity here
            // This step depends on your payment provider's webhook implementation
            
            // console.log("req.body", req.body);
            // console.log("req.body.payload", req.body.payload);
            // console.log("req.body.payload.payment.entity.status", req.body.payload.payment);
            // console.log("req.body.payload.payment.entity",  req.body.payload.payment.entity);
            console.log("webhook:::::::::::",  JSON.stringify(webhookData));
            console.log("?//////////////////////////////////////////////////////")
            console.log("?//////////////////////////////////////////////////////")
            console.log("?//////////////////////////////////////////////////////")
            console.log("?//////////////////////////////////////////////////////")


            // if (req.body.payload.payment.entity.status === "actived") {
            //     console.log("webhookData", JSON.stringify(req.body.payload.payment.entity));

            //     console.log("notes::::", req.body.payload.payment.entityy.notes)
            //     console.log("notes2222::::", JSON.stringify(req.body.payload.payment.entityy.notes))
            //     // const subscriptionId = webhookData.subscription_id;
            //     // const userId = webhookData.user_id;
            //     // const planId = webhookData.plan_id;
            //     // const expirationDate = new Date(webhookData.expiration_date);

            //     // const subscription = await Subscription.findOneAndUpdate(
            //     //     { userId: userId },
            //     //     {
            //     //         status: "active",
            //     //         plan_expired_at: expirationDate,
            //     //         startDate: new Date(),
            //     //     },
            //     //     { upsert: true, new: true }
            //     // );

            //     // return res
            //     //     .status(200)
            //     //     .send(
            //     //         this.responseService.responseWithData(
            //     //             true,
            //     //             StatusCodes.OK,
            //     //             "Subscription activated successfully",
            //     //             subscription
            //     //         )
            //     //     );
            // }

            return res.status(200).send("Webhook received");
        } catch (error) {
            console.log("ERROR", error);
            return res
                .status(200)
                .send(
                    this.responseService.responseWithoutData(
                        false,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Internal server error"
                    )
                );
        }
    };
}

export const subscriptionController = new SubscriptionController();
