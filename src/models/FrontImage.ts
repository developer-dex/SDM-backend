import mongoose from "mongoose";

export const FrontImageSchema = new mongoose.Schema({
    imagePath: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const FrontImage = mongoose.model("FrontImage", FrontImageSchema);

export default FrontImage;
