// var mongoose = require('mongoose');
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const AdminSchema = new mongoose.Schema(
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
        role: {
            type: Number,
            enum: [1, 2, 3], // 1-Admin, 2-Super admin, 3-righter
        },
    },
    {
        timestamps: true,
    }
);
AdminSchema.pre("save", function (next) {
    console.log("dhruvin");
    this.password = bcryptjs.hashSync(this.password);
    next();
});

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;
