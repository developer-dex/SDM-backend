import Razorpay from "razorpay";
import Plan from "../../models/Plans";
import Subscription from "../../models/Subscription";
import mongoose from "mongoose";
import SubscriptionHistory from "../../models/SubscriptionsHistory";
import crypto from "crypto";
import User from "../../models/User";
import { executeQuery, retrieveData } from "../../config/databaseConfig";
import getEnvVar from "../../helpers/util";

export class SubscriptionService {
    private razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });
    }

    createSubscription = async (userId: string, plan: any) => {
        console.log("userId", userId);
        console.log("plan", plan);
        const userQuery = `SELECT * FROM Users WHERE id = '${userId}'`;
        const userInfo = await executeQuery(userQuery);

        const subscription = await this.razorpay.orders.create({
            amount: plan[0].price*100, // Amount in paise
            currency: "INR", // Currency code
            receipt: `receipt#${userId}`, // Unique receipt ID
            notes: {
                userId: userId.toString(),
            },
        });
        console.log("subscription_DETAILS:::::", subscription);

        // Check if the subscription is already created
        const subscriptionQuery = `SELECT * FROM Subscription WHERE userId = '${userId}'`;
        const existingSubscription = await executeQuery(subscriptionQuery);
        if (existingSubscription.rows[0]) {
            console.log("existingSubscription____________", existingSubscription.rows[0]);
            // UPDATE THE EXISTING SUBSCRIPTION QUERY
            const updateSubscriptionQuery = `UPDATE Subscription SET subscriptionId = '${subscription.id}' WHERE userId = '${userId}'`;
            await executeQuery(updateSubscriptionQuery);

            return {
                subscriptionId: subscription.id,
                customerName: userInfo.rows[0].full_name,
                customerEmail: userInfo.rows[0].email,
                planType: plan[0].plan_type,
                razorpayKey: getEnvVar("RAZORPAY_KEY_ID"),
                planId: plan[0].id,
                userId: userId
            };
        } else {
            // INSERT INTO SUBSCRIPTION
            const insertSubscriptionQuery = `INSERT INTO Subscription (userId, planId, subscriptionId, status) VALUES ('${userId}', '${plan[0].id}', '${subscription.id.toString()}', 'created')`;
            await executeQuery(insertSubscriptionQuery);

            // INSERT INTO SUBSCRIPTION HISTORY
            const subscriptionHistoryQuery = `INSERT INTO SubscriptionHistory (userId, planId, subscriptionId, status) VALUES ('${userId}', '${plan[0].id}', '${subscription.id.toString()}', 'created')`;
            await executeQuery(subscriptionHistoryQuery);
        }
        return {
            subscriptionId: subscription.id,
            customerName: "Dhruvin",
            customerEmail: "dhruvin@gmail.com",
            planType: plan[0].plan_type,
            razorpayKey: getEnvVar("RAZORPAY_KEY_ID"),
            planId: plan[0].id,
            userId: userId
        };
    };

    handleSubscriptionWebhook = async (webhookData: any) => {
        console.log("webhookData", webhookData);

        const status = webhookData.payload.payment.entity.status;

        // Update the subscription status
        const subscriptionQuery = `SELECT * FROM Subscriptions WHERE subscriptionId = '${webhookData.payload.payment.entity.id}'`;
        const subscription = await retrieveData(subscriptionQuery);
        if (
            subscription[0] &&
            status.includes(["active", "expired", "cancelled"])
        ) {
            subscription[0].status = webhookData.payload.payment.entity.status;
            await this.updateSubscription(
                webhookData.payload.payment.entity.id,
                webhookData.payload.payment.entity.status
            );
        }

        // Update the subscription history
        const subscriptionHistoryQuery = `SELECT * FROM SubscriptionsHistory WHERE subscriptionId = '${webhookData.payload.payment.entity.id}'`;
        const subscriptionHistory = await retrieveData(
            subscriptionHistoryQuery
        );
        if (
            subscriptionHistory[0] &&
            status.includes(["active", "expired", "cancelled"])
        ) {
            subscriptionHistory[0].status =
                webhookData.payload.payment.entity.status;
            await this.updateSubscriptionHistory(
                webhookData.payload.payment.entity.id,
                webhookData.payload.payment.entity.status
            );
        }
    };

    subscriptionSuccess = async (planData: any, data: any) => {
       const planDetails = `SELECT * FROM Plans WHERE id = '${data.planId}'`;
       const plan = await executeQuery(planDetails);
       // If planDetails.plan_type = monthly then update the plan_expired_at to 30 days from now and it yearly then update the plan_expired_at to 365 days from now
       const planExpiredAt = plan.rows[0].plan_type === "monthly" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
       const updateSubscriptionStatusQuery = `UPDATE Subscription SET status = 'active', planId = '${planData.planId}', plan_expired_at = '${planExpiredAt}' WHERE subscriptionId = '${planData.orderId}'`;
        await executeQuery(updateSubscriptionStatusQuery);

        // Update old subscriptionHistory status to expired
        const updateOldSubscriptionHistoryStatusQuery = `UPDATE SubscriptionHistory SET status = 'expired' WHERE userId = '${planData.userId}'`;
        await executeQuery(updateOldSubscriptionHistoryStatusQuery);

       // INSERT INTO SUBSCRIPTION HISTORY
       const subscriptionHistoryQuery = `INSERT INTO SubscriptionHistory (userId, planId, subscriptionId, status, plan_expired_at) VALUES ('${planData.userId}', '${planData.planId}', '${planData.orderId}', 'created', '${planExpiredAt}')`;
       await executeQuery(subscriptionHistoryQuery);
       
    };

    existPlan = async (planId: string) => {
        const query = `SELECT * FROM Plans WHERE product_id = '${planId}'`;
        const plan = await executeQuery(query);
        console.log("plan", plan.rows);
        return plan.rows;
    };

    updateSubscription = async (subscriptionId: string, status: string) => {
        const updateQuery = `UPDATE Subscriptions SET status = '${status}' WHERE subscriptionId = '${subscriptionId}'`;
        await executeQuery(updateQuery);
    };

    updateSubscriptionHistory = async (
        subscriptionId: string,
        status: string
    ) => {
        const updateQuery = `UPDATE SubscriptionsHistory SET status = '${status}' WHERE subscriptionId = '${subscriptionId}'`;
        await executeQuery(updateQuery);
    };
}
