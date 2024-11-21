import mongoose, { Schema } from "mongoose";
import { ESupportTicketStatus } from "../common/common.enum";

const SupportTicketSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    Topic: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ESupportTicketStatus,
        default: ESupportTicketStatus.OPEN,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const SupportTicket = mongoose.model("SupportTicket", SupportTicketSchema);

export default SupportTicket;
