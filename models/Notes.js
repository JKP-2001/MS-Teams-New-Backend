import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    date: {
        type: Date,
        default: Date.now,
    },

    groupPostId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },


});

const Notes = mongoose.model("Notes", noteSchema);

export {Notes};
