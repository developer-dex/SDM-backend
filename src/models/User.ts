// var mongoose = require('mongoose');
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        signup_media_type: {
            type: Number, // 1 for Google. 2 for Apple 3 for Guest
            enum: [1, 2, 3],
            require: false,
        },
        signup_token: {
            type: String,
            default: "",
            require: false,
        },
        full_name: {
            type: String,
            require: false,
            default: "",
        },
        email: {
            type: String,
            require: false,
            default: "",
        },
        country_code: {
            type: String,
            require: false,
            default: "",
        },
        isd_code: {
            type: String,
            require: false,
            default: "",
        },
        mobile_number: {
            type: String,
            require: false,
            default: "",
        },
        profile_picture: {
            type: String,
            require: false,
            default: "",
        },
        user_verified: {
            type: Boolean,
            default: false,
        },
        block_by_admin: {
            type: Boolean,
            default: false,
            require: false,
        },
        block_at: {
            type: Date,
            require: null,
            default: null,
        },
        is_active: {
            type: Boolean,
            required: false,
            default: false,
        },
        take_subscription: {
            type: Boolean,
            default: false,
        },
        date_of_birth: {
            type: String,
            require: false,
            default: "",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        purchase_token: {
            type: String,
            require: false,
        },
        sku: {
            type: String,
            require: false,
        },
        amount: {
            type: String,
            require: false,
        },
        purchase_time: {
            type: String,
            require: false,
        },
        expired_time: {
            type: String,
            require: false,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", UserSchema);
export default User;
