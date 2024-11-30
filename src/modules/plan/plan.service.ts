import Plan from "../../models/Plans";
import Razorpay from "razorpay";
import { EPlanStatus } from "./plan.interface";
import getEnvVar from "../../helpers/util";
import { retrieveData, executeSqlQuery, executeQuery } from "../../config/databaseConfig";


export class PlanService {
    public razorpay: Razorpay;
    constructor() {
        this.razorpay = new Razorpay({
            key_id: getEnvVar("RAZORPAY_KEY_ID"),
            key_secret: getEnvVar("RAZORPAY_KEY_SECRET"),
        });
    }

    createPlan = async (planCreatePayload: any) => {
        console.log("planCreatePayload:::", planCreatePayload);
        try {
            const plan = await this.razorpay.plans.create({
                period: planCreatePayload.plan_type,
                interval: 1,
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

            console.log("plan:::", plan);
            const insertQuery = `INSERT INTO Plans (plan_name, plan_type, interval, price, product_id, features, min_users, max_users, currency) VALUES ('${planCreatePayload.plan_name}', '${planCreatePayload.plan_type}', '${planCreatePayload.interval}', '${planCreatePayload.price}', '${plan.id}', '${JSON.stringify(planCreatePayload.features)}', '${planCreatePayload.min_users}', '${planCreatePayload.max_users}', '${getEnvVar("CURRENCY")}')`;

            console.log("insertQuery:::", insertQuery);
            return await executeQuery(insertQuery);
            
        } catch (error) {
            console.log(error);
            throw new Error(
                `Failed to create plan: ${error.error?.description || error.message}`
            );
        }
    };

    updatePlan = async (planId: string, features: object) => {
        const updateQuery = `UPDATE Plans SET features = '${JSON.stringify(features)}' WHERE id = '${planId}'`;
        return await executeQuery(updateQuery);
    }

    listing = async (isAdminSide: boolean) => {
        let query = 'SELECT * FROM Plans';
        if (!isAdminSide) {
            query += ` WHERE status = '${EPlanStatus.ACTIVE}'`;
        }

        console.log("query: ", query);
        const plans = await executeQuery(query);
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

    createOffer = async (offerCreatePayload: any) => {
        const offerData = {
            name: offerCreatePayload.name,
            code: offerCreatePayload.code,
            type: offerCreatePayload.type,
            discount: offerCreatePayload.discount,
            plans: offerCreatePayload.plans,
            status: offerCreatePayload.status,
            expire_by: Math.floor(new Date(offerCreatePayload.expire_by).getTime() / 1000)
        };
        // const offer: any = await this.razorpay.offer.create(offerData);
        // return offer;
    }
}
