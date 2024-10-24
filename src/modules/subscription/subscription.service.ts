import Razorpay from "razorpay";
import Plan from "../../models/Plans";
import Subscription from "../../models/Subscription";
import mongoose from "mongoose";
import SubscriptionHistory from "../../models/SubscriptionsHistory";
import crypto from "crypto";
import User from "../../models/User";

export class SubscriptionService {
    private razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });
    }

    createSubscription = async (userId: string, plan: any) => {
        const userInfo = await User.findById(userId)
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: plan.product_id,
            customer_notify: 1,
            total_count: 12,
            notes: {
                userId: userId.toString()
            },
        });

        // Check if the subscription is already created
        const existingSubscription = await Subscription.findOne({ userId: userId });
        if (existingSubscription) {
            // Update the existing subscription
            existingSubscription.status = 'created';
            existingSubscription.subscriptionId = subscription.id;
            existingSubscription.planId = plan._id;
            await existingSubscription.save();
            return {
                subscriptionId: subscription.id,
                shortUrl: subscription.short_url,
                customerName: userInfo?.full_name,
                customerEmail: userInfo?.email,
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
            customerName: userInfo?.full_name,
            customerEmail: userInfo?.email,
            planType: plan.plan_type
        };
    };

    handleSubscriptionWebhook = async (webhookData: any) => {
        console.log("webhookData", webhookData);

        const status = webhookData.payload.payment.entity.status

        // Update the subscription status
        const subscription = await Subscription.findOne({ subscriptionId: webhookData.payload.payment.entity.id });
        if (subscription && status.includes(["active", "expired", "cancelled"])) {
            subscription.status = webhookData.payload.payment.entity.status;
            await subscription.save();
        }

        // Update the subscription history
        const subscriptionHistory = await SubscriptionHistory.findOne({ subscriptionId: webhookData.payload.payment.entity.id });
        if (subscriptionHistory && status.includes(["active", "expired", "cancelled"])) {
            subscriptionHistory.status = webhookData.payload.payment.entity.status;
            await subscriptionHistory.save();
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

            await Subscription.updateOne({ subscriptionId: razorpay_subscription_id }, { $set: { status: "active" } });
            await SubscriptionHistory.updateOne({ subscriptionId: razorpay_subscription_id }, { $set: { status: "active" } });
        } else {
            console.log("Signature is invalid");
        }
    }


    existPlan = async (planId: string) => {
        const plan = await Plan.findOne({ product_id: planId });
        return plan
    }
}
