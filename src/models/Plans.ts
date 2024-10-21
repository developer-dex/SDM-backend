import mongoose from "mongoose";

export const PlanSchema = new mongoose.Schema({
    razorpayPlanId: {
        type: String,
        required: true, // Razorpay plan ID returned from Razorpay
        unique: true,
    },
    planName: {
        type: String,
        required: true, // Name of the plan (e.g., "Premium Plan")
    },
    amount: {
        type: Number,
        required: true, // Amount in paise (store as integer, e.g., 500 INR = 50000 paise)
    },
    currency: {
        type: String,
        required: true, // Currency code (e.g., "INR")
    },
    period: {
        type: String,
        required: true, // Period for the plan (e.g., "monthly", "weekly")
    },
    interval: {
        type: Number,
        required: true, // Interval (e.g., every 1 month)
    },
    status: {
        type: String,
        default: "active", // Plan status (e.g., "active", "inactive")
    },
    description: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now, // Timestamp when the plan was created
    },
});

const Plan = mongoose.model("Plan", PlanSchema);

export default Plan;
