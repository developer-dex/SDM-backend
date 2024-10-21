import mongoose, { Schema } from "mongoose";

const SubscriptionHistorySchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled"],
            default: "active",
            required: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        plan_expired_at: {
            type: Date,
            required: true,
        },
        cancelledAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const SubscriptionHistory = mongoose.model(
    "SubscriptionHistory",
    SubscriptionHistorySchema
);

export default SubscriptionHistory;
