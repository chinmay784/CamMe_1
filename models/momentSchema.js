const mongoose = require('mongoose');

const momentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: [String],
        required: true
    },
    descripition: {
        type: String,
        required: true
    },
    comments: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            comment: {
                type: String,
                required: true,
            },
        },
    ],
    expressions: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        },
    ],
    viewers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours = 86400 seconds
    }
});

module.exports = mongoose.model('Moment', momentSchema);
