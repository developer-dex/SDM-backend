import mongoose from "mongoose";
const { Schema } = mongoose;

// Define the feature schema
const featureSchema = new Schema({
    feature_name: { type: String, required: true },
    is_available: { type: Boolean, required: true },
});

// Define the main schema for product plans
const PlanSchema = new Schema(
    {
        product_id: { type: String, required: true }, // Unique product ID
        plan_type: {
            type: String,
            required: true,
        },
        plan_name: { type: String, required: true }, // Plan name: e.g., STANDARD, PROFESSIONAL
        price: { type: Number, required: true },
        features: [featureSchema],
        min_users: { type: Number, required: false },
        max_users: { type: Number, required: false },
        currency: {
            type: String,
            required: true, // Currency code (e.g., "INR")
        },
        interval: {
            type: Number,
            required: true, // Interval (e.g., every 1 month)
        },
        status: {
            type: String,
            default: "active", // Plan status (e.g., "active", "inactive")
        },
        createdAt: {
            type: Date,
            default: Date.now, // Timestamp when the plan was created
        },
    },
    { timestamps: true }
);

// Create and export the model
const Plan = mongoose.model("Plan", PlanSchema);

export default Plan;
