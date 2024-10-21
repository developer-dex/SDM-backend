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
                period: planCreatePayload.period,
                interval: planCreatePayload.interval,
                item: {
                    name: planCreatePayload.planName,
                    amount: planCreatePayload.amount,
                    currency: "INR",
                    description: planCreatePayload.description,
                },
                // ,
                // notes: {
                //   notes_key_1: "Tea, Earl Grey, Hot",
                //   notes_key_2: "Tea, Earl Grey… decaf."
                // }
            });
            return await Plan.create({
                ...planCreatePayload,
                razorpayPlanId: plan.id,
                currency: getEnvVar("CURRENCY"),
            });
        } catch (error) {
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
            razorpayPlanId: planId,
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
                    razorpayPlanId: planId,
                },
            }
        );
    };
}
