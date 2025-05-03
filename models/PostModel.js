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
});

module.exports = mongoose.model("Postcreate", postSchema);
