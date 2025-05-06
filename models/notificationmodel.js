const mongoose = require('mongoose');

// Define the notification schema
const notificationSchema = new mongoose.Schema({
    userId: {  // The user who will receive the notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {  // The message content of the notification
        type: String,
        required: true
    },
    postId: {  // The post associated with the notification (optional, can be null)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Postcreate',
        required: false
    },
    type: {  // Type of notification (could be 'TedBlackCoinVoting', 'NewFriendRequest', etc.)
        type: String,
        required: true
    },
    status: {  // Notification status ('unread' or 'read')
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    createdAt: {  // Timestamp when the notification was created
        type: Date,
        default: Date.now
    },
    votingResponse: {  // User's voting response (optional)
        type: String,
        enum: ['agree', 'disagree', 'pending'],
        default: 'pending'
    }
});

// Create the Notification model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
