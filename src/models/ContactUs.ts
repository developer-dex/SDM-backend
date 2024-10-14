import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phoneNo: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    subject: {
        type: String,
        trim: true,
    },
    message: {
        type: String,
        required: true, // TODO :- suggestion charactor limit
    },
});

const ContactUs = mongoose.model("ContactUs", ContactSchema);

export default ContactUs;
