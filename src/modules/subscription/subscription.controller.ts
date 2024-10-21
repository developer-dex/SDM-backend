import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { SubscriptionService } from "./subscription.service";
import Subscription from "../../models/Subscription";

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
        try {
            const subscriptionData =
                await this.subscriptionService.createSubscription(requestData);
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
            return next(error);
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

            if (webhookData.event === "subscription.succeeded") {
                const subscriptionId = webhookData.subscription_id;
                const userId = webhookData.user_id;
                const planId = webhookData.plan_id;
                const expirationDate = new Date(webhookData.expiration_date);

                const subscription = await Subscription.findOneAndUpdate(
                    { userId: userId, planId: planId },
                    {
                        status: "active",
                        plan_expired_at: expirationDate,
                        startDate: new Date(),
                    },
                    { upsert: true, new: true }
                );

                return res
                    .status(200)
                    .send(
                        this.responseService.responseWithData(
                            true,
                            StatusCodes.OK,
                            "Subscription activated successfully",
                            subscription
                        )
                    );
            }

            return res.status(200).send("Webhook received");
        } catch (error) {
            return next(error);
        }
    };
}

export const subscriptionController = new SubscriptionController();
