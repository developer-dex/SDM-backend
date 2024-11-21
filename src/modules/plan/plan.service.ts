import Plan from "../../models/Plans";
import Razorpay from "razorpay";
import { EPlanStatus } from "./plan.interface";
import getEnvVar from "../../helpers/util";
import { retrieveData, executeSqlQuery } from "../../config/databaseConfig";

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
            const insertQuery = `INSERT INTO Plans (plan_name, plan_type, interval, price, product_id, features, min_users, max_users, currency) VALUES ('${planCreatePayload.plan_name}', '${planCreatePayload.plan_type}', '${planCreatePayload.interval}', '${planCreatePayload.price}', '${plan.id}', '${JSON.stringify(planCreatePayload.features)}', '${planCreatePayload.min_users}', '${planCreatePayload.max_users}', '${getEnvVar("CURRENCY")}')`;
            return await executeSqlQuery(insertQuery);
            
        } catch (error) {
            console.log(error);
            throw new Error(
                `Failed to create plan: ${error.error?.description || error.message}`
            );
        }
    };

    listing = async (isAdminSide: boolean) => {
        let query = 'SELECT * FROM Plans';
        if (!isAdminSide) {
            query += ` WHERE status = '${EPlanStatus.ACTIVE}'`;
        }
        const plans = await retrieveData(query);
        return plans;
    };

    changePlanStatus = async (planId: string, status: string) => {

        const query = `SELECT * FROM Plans WHERE product_id = '${planId}'`;
        const currentPlanStatus = await retrieveData(query);
        if (!currentPlanStatus[0]) {
            throw new Error("Plan not found");
        }
        const newPlanStatus =
            currentPlanStatus[0].status === EPlanStatus.ACTIVE
                ? EPlanStatus.INACTIVE
                : EPlanStatus.ACTIVE;
        const updateQuery = `UPDATE Plans SET status = '${newPlanStatus}' WHERE product_id = '${planId}'`;
        await executeSqlQuery(updateQuery);

        const plansQuery = `SELECT * FROM Plans`;
        return await retrieveData(plansQuery);
    };
}
