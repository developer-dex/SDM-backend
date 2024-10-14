import mongoose from "mongoose";

export const UserDeviceSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        device_type: {
            type: Number, // 0 - ios / 1 - Android
            require: true,
        },
        device_id: {
            type: String,
            require: true,
        },
        version: {
            type: String,
            require: true,
        },
        device_model: {
            type: String,
            require: true,
        },
        device_name: {
            type: String,
            default: "",
        },
        token: {
            type: String,
            default: "",
        },
        fcm_token: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const UserDevices = mongoose.model("UserDevices", UserDeviceSchema);
export default UserDevices;
