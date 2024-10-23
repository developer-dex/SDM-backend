import Razorpay from "razorpay";
import Plan from "../../models/Plans";
import Subscription from "../../models/Subscription";
import mongoose from "mongoose";
export class SubscriptionService {
    private razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });
    }

    createSubscription = async (planId: string, userId: string) => {
        
        const plan = await Plan.findOne({ product_id: planId });
        // console.log("plan", plan);
        if (!plan) {
            throw new Error("Plan not found");
        }
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: plan.product_id,
            customer_notify: 1,
            total_count: 12,
            notes: {
                userId: userId.toString()
            },
        });


        // create user subscription entry
        // await Subscription.create({
        //     userId: new mongoose.Types.ObjectId(userId),
        //     planId: new mongoose.Types.ObjectId(planId),
        //     status: 'Pending',
        // });

        console.log("subscription", JSON.stringify(subscription));
        return {
            subscriptionId: subscription.id,
            shortUrl: subscription.short_url, 
        };
    };
}
