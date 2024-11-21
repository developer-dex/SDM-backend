import Razorpay from "razorpay";
import Plan from "../../models/Plans";
import Subscription from "../../models/Subscription";
import mongoose from "mongoose";
import SubscriptionHistory from "../../models/SubscriptionsHistory";
import crypto from "crypto";
import User from "../../models/User";
import { executeSqlQuery, retrieveData } from "../../config/databaseConfig";

export class SubscriptionService {
    private razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });
    }

    createSubscription = async (userId: string, plan: any) => {
        const userQuery = `SELECT * FROM Users WHERE id = '${userId}'`; 
        const userInfo = await retrieveData(userQuery);

        const subscription = await this.razorpay.subscriptions.create({
            plan_id: plan.product_id,
            customer_notify: 1,
            total_count: 12,
            notes: {
                userId: userId.toString()
            },
        });

        // Check if the subscription is already created
        const subscriptionQuery = `SELECT * FROM Subscriptions WHERE userId = '${userId}'`;
        const existingSubscription = await retrieveData(subscriptionQuery);
        if (existingSubscription[0]) {
            // Update the existing subscription
            existingSubscription[0].status = 'created';
            existingSubscription[0].subscriptionId = subscription.id;
            existingSubscription[0].planId = plan._id;
            await existingSubscription[0].save();
            return {
                subscriptionId: subscription.id,
                shortUrl: subscription.short_url,
                customerName: userInfo[0].full_name,
                customerEmail: userInfo[0].email,
                planType: plan.plan_type
            };
        }

        // create user subscription entry
        await Subscription.create({
            userId: userId,
            planId: plan._id,
            subscriptionId: subscription.id,
            status: 'created',
        });

        // Also make entry in subscription history
        await SubscriptionHistory.create({
            userId: new mongoose.Types.ObjectId(userId),
            planId: plan._id,
            subscriptionId: subscription.id,
            status: 'created',
        });


  
        // Razorpay integration should be handled on the client-side
        // Remove the Razorpay initialization and opening here

        console.log("subscription", JSON.stringify(subscription));
        return {
            subscriptionId: subscription.id,
            shortUrl: subscription.short_url,
            customerName: userInfo[0].full_name,
            customerEmail: userInfo[0].email,
            planType: plan.plan_type
        };
    };

    handleSubscriptionWebhook = async (webhookData: any) => {
        console.log("webhookData", webhookData);

        const status = webhookData.payload.payment.entity.status

        // Update the subscription status
        const subscriptionQuery = `SELECT * FROM Subscriptions WHERE subscriptionId = '${webhookData.payload.payment.entity.id}'`;
        const subscription = await retrieveData(subscriptionQuery);
        if (subscription[0] && status.includes(["active", "expired", "cancelled"])) {
            subscription[0].status = webhookData.payload.payment.entity.status;
            await this.updateSubscription(webhookData.payload.payment.entity.id, webhookData.payload.payment.entity.status);
        }

        // Update the subscription history
        const subscriptionHistoryQuery = `SELECT * FROM SubscriptionsHistory WHERE subscriptionId = '${webhookData.payload.payment.entity.id}'`;
        const subscriptionHistory = await retrieveData(subscriptionHistoryQuery);
        if (subscriptionHistory[0] && status.includes(["active", "expired", "cancelled"])) {
            subscriptionHistory[0].status = webhookData.payload.payment.entity.status;
            await this.updateSubscriptionHistory(webhookData.payload.payment.entity.id, webhookData.payload.payment.entity.status);
        }
    }

    subscriptionSuccess = async (successData: any) => {
        console.log("successData", successData);
        const {razorpay_payment_id, razorpay_subscription_id, razorpay_signature} = successData

        const webhookSecret = process.env.RAZORPAY_KEY_SECRET as string

        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(`${razorpay_payment_id}|${razorpay_subscription_id}`);
        const expectedSignature = hmac.digest('hex');

        if (razorpay_signature === expectedSignature) {
            console.log("Signature is valid");

            const updateSubscriptionStatusQuery  = `UPDATE Subscriptions SET status = 'active' WHERE subscriptionId = '${razorpay_subscription_id}'`;
            await executeSqlQuery(updateSubscriptionStatusQuery);

            const updateSubscriptionHistoryStatusQuery = `UPDATE SubscriptionsHistory SET status = 'active' WHERE subscriptionId = '${razorpay_subscription_id}'`;
            await executeSqlQuery(updateSubscriptionHistoryStatusQuery);
        } else {
            console.log("Signature is invalid");
        }
    }


    existPlan = async (planId: string) => {
        const query = `SELECT * FROM Plans WHERE product_id = '${planId}'`;
        const plan = await retrieveData(query);
        return plan[0]
    }

    updateSubscription = async (subscriptionId: string, status: string) => {
        const updateQuery = `UPDATE Subscriptions SET status = '${status}' WHERE subscriptionId = '${subscriptionId}'`;
        await executeSqlQuery(updateQuery);
    }

    updateSubscriptionHistory = async (subscriptionId: string, status: string) => {
        const updateQuery = `UPDATE SubscriptionsHistory SET status = '${status}' WHERE subscriptionId = '${subscriptionId}'`;
        await executeSqlQuery(updateQuery);
    }
}
