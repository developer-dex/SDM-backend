// var mongoose = require('mongoose');
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
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
        password: {
            type: String,
            require: false,
            default: "",
        },
        is_verified: {
            type: Boolean,
            default: false,
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
