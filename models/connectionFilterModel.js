const mongoose = require("mongoose");

const connectionFilterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    intrestedFiled: [{
        type: String,
        required: true,
    }],
    hashTag: [{
        type: String,
        required: true,
    }],
    location: {
        lattitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ConnectionFilter", connectionFilterSchema);


/**
 * @swagger
 * /user/connectionFilter:
 *   post:
 *     summary: Create or update a user's connection filter.
 *     tags:
 *       - Connection Filter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address.
 *                 example: "example@gmail.com"
 *               intrest:
 *                 type: string
 *                 description: Interest to be added.
 *                 example: "Technology"
 *               hashTag:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of hashtags to be added.
 *                 example: ["#AI", "#Startups"]
 *               lattitude:
 *                 type: number
 *                 description: User's current latitude.
 *                 example: 22.5726
 *               longitude:
 *                 type: number
 *                 description: User's current longitude.
 *                 example: 88.3639
 *     responses:
 *       200:
 *         description: Connection filter saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Connection filter saved successfully
 *                 connection:
 *                   $ref: '#/components/schemas/ConnectionFilter'
 *       400:
 *         description: Missing required fields like email.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */