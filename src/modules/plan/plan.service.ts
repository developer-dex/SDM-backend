import Plan from "../../models/Plans";
import Razorpay from "razorpay";
import { EPlanStatus } from "./plan.interface";
import getEnvVar from "../../helpers/util";

export class PlanService {
    public razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: getEnvVar("RAZORPAY_KEY_ID"),
            key_secret: getEnvVar("RAZORPAY_KEY_SECRET"),
        });
    }

    createPlan = async (planCreatePayload: any) => {
        try {
            const plan = await this.razorpay.plans.create({
                period: planCreatePayload.plan_type,
                interval: planCreatePayload.interval,
                item: {
                    name: planCreatePayload.plan_name,
                    amount: planCreatePayload.price,
                    currency: "INR",
                    description: planCreatePayload.plan_name,
                },
                // ,
                // notes: {
                //   notes_key_1: "Tea, Earl Grey, Hot",
                //   notes_key_2: "Tea, Earl Grey… decaf."
                // }
            });
            console.log(plan.id);
            return await Plan.create({
                ...planCreatePayload,
                product_id: plan.id,
                // currency: getEnvVar("CURRENCY"),
            });
        } catch (error) {
            console.log(error);
            throw new Error(
                `Failed to create plan: ${error.error?.description || error.message}`
            );
        }
    };

    listing = async (isAdminSide: boolean) => {
        const query = isAdminSide ? {} : { status: EPlanStatus.ACTIVE };
        const plans = await Plan.find(query);
        return plans;
    };

    changePlanStatus = async (planId: string, status: string) => {
        const currentPlanStatus = await Plan.findOne({
            product_id: planId,
        });
        if (!currentPlanStatus) {
            throw new Error("Plan not found");
        }
        const newPlanStatus =
            currentPlanStatus.status === EPlanStatus.ACTIVE
                ? EPlanStatus.INACTIVE
                : EPlanStatus.ACTIVE;
        await Plan.updateOne(
            { status: newPlanStatus },
            {
                where: {
                    product_id: planId,
                },
            }
        );
    };
}
