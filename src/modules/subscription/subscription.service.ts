import Razorpay from "razorpay";
import Plan from "../../models/Plans";
import Subscription from "../../models/Subscription";
import mongoose from "mongoose";
import SubscriptionHistory from "../../models/SubscriptionsHistory";
import crypto from "crypto";
import User from "../../models/User";
import { executeQuery, retrieveData } from "../../config/databaseConfig";

export class SubscriptionService {
    private razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });
    }

    createSubscription = async (userId: string, plan: any) => {
        console.log("userId", plan);
        const userQuery = `SELECT * FROM Users WHERE id = '${userId}'`; 
        const userInfo = await retrieveData(userQuery);

        // const subscription = await this.razorpay.subscriptions.create({
        //     plan_id: plan.product_id,
        //     customer_notify: 1,
        //     total_count: 12,
        //     notes: {
        //         userId: userId.toString()
        //     },
        // });

        // Create an order for a one-time payment
        const subscription = await this.razorpay.orders.create({
            amount: 100, // Amount in paise
            currency: "INR", // Currency code
            receipt: `receipt#${userId}`, // Unique receipt ID
            notes: {
                userId: userId.toString()
            },
        });
        console.log("subscription_DETAILS:::::", subscription);

        // Check if the subscription is already created
        const subscriptionQuery = `SELECT * FROM Subscription WHERE userId = '${userId}'`;
        const existingSubscription = await retrieveData(subscriptionQuery);
        if (existingSubscription[0]) {
            // Update the existing subscription
            existingSubscription[0].status = 'created';
            existingSubscription[0].subscriptionId = subscription.id;
            existingSubscription[0].planId = plan.id;
            await existingSubscription[0].save();
            return {
                subscriptionId: subscription.id,
                customerName: userInfo[0].full_name,
                customerEmail: userInfo[0].email,
                planType: plan.plan_type
            };
        }

        // // create user subscription entry
        await Subscription.create({
            userId: userId,
            planId: plan.id,
            subscriptionId: subscription.id.toString(),
            status: 'created',
        });

        // Also make entry in subscription history
        await SubscriptionHistory.create({
            userId: new mongoose.Types.ObjectId(userId),
            planId: plan.id,
            subscriptionId: subscription.id.toString(),
            status: 'created',
        });


  
        // Razorpay integration should be handled on the client-side
        // Remove the Razorpay initialization and opening here

        console.log("Plan:::::", plan);
        console.log("subscription", JSON.stringify(subscription));
        return {
            subscriptionId: subscription.id,
            customerName: "Dhruvin",
            customerEmail: 'dhruvin@gmail.com',
            planType: plan[0].plan_type
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

    subscriptionSuccess = async (orderId: string) => {
        console.log("successData", orderId);
        const updateSubscriptionStatusQuery  = `UPDATE Subscription SET status = 'active' WHERE subscriptionId = '${orderId}'`;
        await executeQuery(updateSubscriptionStatusQuery);

        const updateSubscriptionHistoryStatusQuery = `UPDATE SubscriptionHistory SET status = 'active' WHERE subscriptionId = '${orderId}'`;
        await executeQuery(updateSubscriptionHistoryStatusQuery);
        // const {razorpay_payment_id, razorpay_subscription_id, razorpay_signature} = orderId

        // const webhookSecret = process.env.RAZORPAY_KEY_SECRET as string

        // const hmac = crypto.createHmac('sha256', webhookSecret);
        // hmac.update(`${razorpay_payment_id}|${razorpay_subscription_id}`);
        // const expectedSignature = hmac.digest('hex');

        // if (razorpay_signature === expectedSignature) {
        //     console.log("Signature is valid");

           
        // } else {
        //     console.log("Signature is invalid");
        // }
    }


    existPlan = async (planId: string) => {
        const query = `SELECT * FROM Plans WHERE product_id = '${planId}'`;
        const plan = await executeQuery(query);
        console.log("plan", plan.rows);
        return plan.rows
    }

    updateSubscription = async (subscriptionId: string, status: string) => {
        const updateQuery = `UPDATE Subscriptions SET status = '${status}' WHERE subscriptionId = '${subscriptionId}'`;
        await executeQuery(updateQuery);
    }

    updateSubscriptionHistory = async (subscriptionId: string, status: string) => {
        const updateQuery = `UPDATE SubscriptionsHistory SET status = '${status}' WHERE subscriptionId = '${subscriptionId}'`;
        await executeQuery(updateQuery);
    }
}
