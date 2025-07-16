const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    groupImage: {
        type: String, // optional (URL or base64 or filename)
        required: false
    },
});

module.exports = mongoose.model("Group", groupSchema);
