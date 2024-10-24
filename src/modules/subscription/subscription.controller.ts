import { NextFunction, Request, Response } from "express";
import { ResponseService } from "../../helpers/response.service";
import { StatusCodes } from "../../common/responseStatusEnum";
import { SubscriptionService } from "./subscription.service";
import getEnvVar from "../../helpers/util";

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
            const isPlanExist = await this.subscriptionService.existPlan(requestData.planId);
            if(!isPlanExist) {
                return res.status(200).send(this.responseService.responseWithoutData(false, StatusCodes.BAD_REQUEST, "Plan not found"));
            }
            const subscriptionData =
                await this.subscriptionService.createSubscription(token_payload.data._id, isPlanExist) ;
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


            await this.subscriptionService.handleSubscriptionWebhook(webhookData);
            // Verify the webhook signature or authenticity here
            // This step depends on your payment provider's webhook implementation
            
            // console.log("req.body", req.body);
            // console.log("req.body.payload", req.body.payload);
            // console.log("req.body.payload.payment.entity.status", req.body.payload.payment);
            // console.log("req.body.payload.payment.entity",  req.body.payload.payment.entity);
            // console.log("webhook:::::::::::",  JSON.stringify(webhookData));
            // console.log("?//////////////////////////////////////////////////////")
            // console.log("?//////////////////////////////////////////////////////")
            // console.log("?//////////////////////////////////////////////////////")
            // console.log("?//////////////////////////////////////////////////////")


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

            return res.status(200).send("subscription webhook handled successfully");
        } catch (error) {
            console.log("subscription webhook", error);
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

    subscriptionSuccess = async (req: Request, res: Response, next: NextFunction) => {
        console.log("subscription success", req.body);
        try {
            await this.subscriptionService.subscriptionSuccess(req.body);
            return res.redirect(getEnvVar("FRONTEND_URL") + "/home");
          
        } catch (error) {
            console.log("subscription success", error);
            return res.status(200).send("subscription success");
        }
    }

}

export const subscriptionController = new SubscriptionController();
