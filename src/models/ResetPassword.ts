import mongoose, { Schema } from 'mongoose';

export const ResetPasswordSchema: Schema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    expired_at: {
        type: Date,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const ResetPassword = mongoose.model("ResetPassword", ResetPasswordSchema);

export default ResetPassword;
