const mongoose = require("mongoose");

const GroupmessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "receiverType" // dynamic reference
    },
    receiverType: {
        type: String,
        enum: ["Group"],
        default: 'Group', //  "Group" for group chat
        required: true
    },
    message: String,
    messageType: {
        type: String,
        default: "text"
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date
}, { timestamps: true });

module.exports = mongoose.model("GroupMessage", GroupmessageSchema);
