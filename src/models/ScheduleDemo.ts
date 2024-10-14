import mongoose from "mongoose";

const ScheduleDemoSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    phoneNo: {
        type: String,
        required: true,
        trim: true,
    },
    emailAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    jobTitle: {
        type: String,
        trim: true,
    },
    industry: {
        type: String,
        required: true,
    },
    companySize: {
        type: Number,
        required: true,
    },
    preferredDate: {
        type: Date,
        required: true,
    },
    preferredTime: {
        type: String,
        required: true,
    },
});

const ScheduleDemo = mongoose.model("ScheduleDemo", ScheduleDemoSchema);

export default ScheduleDemo;
