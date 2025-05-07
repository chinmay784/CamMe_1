const { contentType, type } = require("express/lib/response");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    content: {
        image: {
            type: Boolean,
            default: false,
        },
        imageUrl: {
            type: [String],
            required: function () {
                return this.content?.image === true;
            },
        },
        description: {
            type: Boolean,
            default: true,
        },
        descriptionText: {
            type: String,
            required: function () {
                return this.content?.description === true;
            },
        },
    },
    visibility: {
        type: Boolean,
        enum: [true, false],
        default: true, // false = private, true = public
    },
    is_photography: {
        type: Boolean,
        enum: [true, false],
        default: false, // false = text, true = image
    },
    hashTag: {
        type: String,
        required: false,
    },
    imageFilter: {
        type: String,
        enum: ['normal', 'clarendon', 'sepia', 'grayscale', 'lark', 'moon', 'aden', 'perpetua'],
        default: 'normal',
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
    tedGoldGivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    tedGoldCount: {
        type: Number,
        default: 0
    },
    tedSilverGivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    tedSilverCount: {
        type: Number,
        default: 0
    },
    tedBronzeGivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    tedBlackCoinData: {
        givenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        reason: String,
        givenAt: Date,
        votingEndsAt: Date,
        votes: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            vote: { type: String, enum: ['agree', 'disagree'] }
        }],
        status: {
            type: String,
            enum: ['pending', 'resolved'],
            default: 'pending'
        }
    },
    shareCount: {
        type: Number,
        default: 0,
    },
    shares: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model("Postcreate", postSchema);
