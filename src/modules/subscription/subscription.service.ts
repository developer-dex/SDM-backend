import Razorpay from "razorpay";
import Plan from "../../models/Plans";

export class SubscriptionService {
    private razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });
    }

    createSubscription = async (subscriptionCreatePayload: any) => {
        const { planId, userId } = subscriptionCreatePayload;
        const plan = await Plan.findOne({ razorpayPlanId: planId });
        if (!plan) {
            throw new Error("Plan not found");
        }
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: plan.product_id,
            customer_notify: 1,
            total_count: 12,
        });

        return {
            subscriptionId: subscription.id,
            shortUrl: subscription.short_url, 
        };
    };
}
