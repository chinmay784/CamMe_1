const express = require('express');
const {
    register,
    otpVerify,
    ProfileCreation,
    login,
    loginOtpverify,
    connectionFilter,
    getConnectionFilter,
    PasswordResetRequest,
    resetPassword,
    addAccount,
    approveLinkAccount,
    finalizeLinkAccount,
    rejectLinkAccount,
    logoutUser,
    getMatchedIntrested,
    getHashTagContent,
    getAllowLocation,
    sendFriendRequest,
    acceptFriendRequest,
    createPost,
    giveTedBlackCoinToPost,
    report,
    createMoment,
    generateAndTrackShare,
    getAllFriends,
    sharePostWithFriend
} = require("../controllers/userAuthController")
const { authMiddelWere } = require('../middelwere/authMiddelWere');
const {uploadd} = require("../middelwere/multer");
const checkBlacklist = require('../middelwere/BlackListToken');
const {upload} = require("../config/cloudinary")

const router = express.Router();

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with profile image, and receive OTP via email and phone
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - gender
 *               - theme
 *               - dateBirth
 *               - fullName
 *               - email
 *               - phoneNo
 *             properties:
 *               gender:
 *                 type: string
 *                 example: male
 *               theme:
 *                 type: string
 *                 example: dark
 *               dateBirth:
 *                 type: string
 *                 format: date
 *                 example: 1998-01-01
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               phoneNo:
 *                 type: string
 *                 example: +1234567890
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OTP sent to email and phone number
 *       400:
 *         description: Bad request
 */
router.post('/register',upload.single("file"), register);
/**
 * @swagger
 * /user/verifyotp:
 *   post:
 *     summary: Verify OTP and activate user account
 *     description: Verifies the OTP sent to the user's email and activates the account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified. Account Activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP verified. Account Activated
 *                 user:
 *                   type: object
 *                   description: The verified user object
 *       400:
 *         description: Invalid or expired OTP / missing fields
 *       500:
 *         description: Internal server error
 */
router.post("/verifyotp", otpVerify);
/**
 * @swagger
 * /user/profileComplite:
 *   post:
 *     summary: Complete user profile by setting username and password
 *     description: After OTP verification, user sets their username and password to complete the profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - userName
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: MySecurePass123
 *               userName:
 *                 type: string
 *                 example: johnny98
 *     responses:
 *       200:
 *         description: Profile completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing fields or user not found
 *       500:
 *         description: Internal server error
 */
router.post("/profileComplite", ProfileCreation);
/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login with OTP verification
 *     description: Logs in a user by verifying credentials and sends OTP via email and SMS for further verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - userName
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: MySecurePass123
 *               userName:
 *                 type: string
 *                 example: johnny98
 *     responses:
 *       200:
 *         description: OTP sent to user via email and phone
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP sent to your email and phone number
 *       400:
 *         description: Invalid credentials or unverified email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Please provide all details
 *       500:
 *         description: Internal server error
 */
router.post("/login", login);
/**
 * @swagger
 * /user/loginOtpverify:
 *   post:
 *     summary: Verify OTP during login
 *     description: Verifies the OTP sent to the user's email/phone and logs them in by issuing a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified successfully, user logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login Otp Verify
 *                 user:
 *                   type: object
 *                   example:
 *                     _id: 609e125a5d1f4a1d3cfa7e3d
 *                     email: johndoe@example.com
 *                     userName: johnny98
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *       400:
 *         description: Invalid or expired OTP, or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid Or Expired OTP
 *       500:
 *         description: Internal server error
 */
router.post("/loginOtpverify", loginOtpverify);
/**
 * @swagger
 * /user/connectionFilter:
 *   post:
 *     summary: Set or update a user's connection filter
 *     description: Allows a user to set or update their interests, hashtags, and locations for connection filtering.
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
 *                 example: johndoe@example.com
 *               intrest:
 *                 type: string
 *                 example: Technology
 *               hashtag:
 *                 type: string
 *                 example: #AI
 *               tag:
 *                 type: string
 *                 example: artificial-intelligence
 *               location:
 *                 type: string
 *                 example: New York
 *     responses:
 *       200:
 *         description: Connection filter saved successfully
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
 *                   type: object
 *                   example:
 *                     userId: 609e125a5d1f4a1d3cfa7e3d
 *                     intrestedFiled: [{ intrested: "Technology" }]
 *                     hashTagFiled: [{ hashTag: "#AI", tag: "artificial-intelligence" }]
 *                     locationFiled: [{ location: "New York" }]
 *       400:
 *         description: Email not provided
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error in connection filter controller
 */
router.post("/connectionFilter", connectionFilter);
/**
 * @swagger
 * /user/getConnectionFilter:
 *   get:
 *     summary: Retrieve a user's connection filter settings
 *     description: Fetches the stored connection filter (interests, hashtags, tags, and locations) for a given user.
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *         example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Connection filter retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example:
 *                     userId: 609e125a5d1f4a1d3cfa7e3d
 *                     intrestedFiled: [{ intrested: "Technology" }]
 *                     hashTagFiled: [{ hashTag: "#AI", tag: "artificial-intelligence" }]
 *                     locationFiled: [{ location: "New York" }]
 *       400:
 *         description: Email not provided
 *       404:
 *         description: User or connection filter not found
 *       500:
 *         description: Server error in getConnectionFilter controller
 */
router.get("/getConnectionFilter", getConnectionFilter);
/**
 * @swagger
 * /user/forgetPassword:
 *   post:
 *     summary: Request password reset link via email or phone number
 *     description: Sends a JWT-based password reset link to the user's email or phone number (Twilio SMS). The token is valid for 10 minutes.
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
 *                 example: johndoe@example.com
 *               phoneNo:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Link send to Email Or Via Phone No
 *       400:
 *         description: User not found using provided email
 *       500:
 *         description: Error in PasswordResetRequest controller
 */
router.post("/forgetPassword", PasswordResetRequest);
/**
 * @swagger
 * /user/resetPassword:
 *   post:
 *     summary: Reset user password using a valid JWT token
 *     description: Accepts a new password and a JWT token (from email or SMS) to reset the user's password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - token
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPassword123!
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Invalid token or user not found
 *       500:
 *         description: Error in resetPassword controller
 */
router.post("/reset-password", resetPassword);
/**
 * @swagger
 * /user/addAccount:
 *   post:
 *     summary: Request to link a secondary account to the main account
 *     description: Authenticated users can send a request to link another user account by verifying the secondary account's password. An email and SMS will be sent to the secondary account for approval.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - phoneNo
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: secondaryUser
 *               email:
 *                 type: string
 *                 example: secondary@example.com
 *               phoneNo:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: SecondaryPass123!
 *     responses:
 *       200:
 *         description: Approval email and SMS sent to secondary account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Approval email & SMS sent to secondary user.
 *                 secondaryAccount:
 *                   type: object
 *                   description: The secondary user account details
 *                 main:
 *                   type: object
 *                   description: The main user account details
 *       400:
 *         description: Invalid request (e.g., trying to link own account or duplicate request)
 *       401:
 *         description: Invalid password for the secondary account
 *       404:
 *         description: Secondary account not found
 *       500:
 *         description: Error in addAccount controller
 */
router.post("/addAccount",authMiddelWere,addAccount)
router.get("/account-link/approve/:userId/:requesterId", approveLinkAccount);
router.post("/account-link/verify-otp", finalizeLinkAccount);
router.post("/account-link/reject/:userId/:requesterId", rejectLinkAccount);
router.post("/logout", checkBlacklist,logoutUser);
router.get("/getMatchIntrested",authMiddelWere,getMatchedIntrested);
router.get("/getHashTagContent",authMiddelWere,getHashTagContent);
router.get("/getLocation",authMiddelWere,getAllowLocation);
router.post("/inviteAFriend/:reciverId",authMiddelWere,sendFriendRequest);
router.post("/acceptFriendRequest/:requestId",authMiddelWere,acceptFriendRequest);
/**
 * @swagger
 * /user/createpost:
 *   post:
 *     summary: Create a new post
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "This is my first post"
 *               visibility:
 *                 type: boolean
 *                 example: true
 *               hashTag:
 *                 type: string
 *                 example: "#travel"
 *               imageFilter:
 *                 type: string
 *                 enum: [normal, clarendon, sepia, grayscale, lark, moon, aden, perpetua]
 *                 example: "normal"
 *               contentType:
 *                 type: boolean
 *                 example: true
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Post created successfully
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
 *                   example: Post created successfully
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: https://cloudinary.com/image.jpg
 *                 visibility:
 *                   type: boolean
 *                   example: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 newPost:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request (missing or invalid fields)
 *       500:
 *         description: Internal server error
 */
router.post("/createpost", authMiddelWere, upload.array("files", 10), createPost);
/**
 * @swagger
 * /post/share/{postId}/{friendId}:
 *   post:
 *     summary: Share a post with a friend
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the original post to share
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend to share the post with
 *     responses:
 *       200:
 *         description: Post shared successfully
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
 *                   example: Post shared successfully your friend
 *                 sharedPostId:
 *                   type: string
 *                   example: 6629a314d67d72a3a0989f4e
 *                 originalPost:
 *                   type: object
 *                   description: Original post data
 *       403:
 *         description: Not a friend, sharing not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not a friend, so post Not share
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Post not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
router.post('/share/:postId/:friendId', authMiddelWere, sharePostWithFriend);
router.post("/givetedBlackCoin/:postId",authMiddelWere,giveTedBlackCoinToPost);
router.post("/reportPost/:postId",authMiddelWere,report);
/**
 * @swagger
 * /user/moments:
 *   post:
 *     summary: Upload a new moment
 *     description: Authenticated users can create a moment with an image and description. The moment will expire in 24 hours.
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - descripition
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *               descripition:
 *                 type: string
 *                 example: Enjoying the sunset!
 *     responses:
 *       201:
 *         description: Moment created successfully
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
 *                   example: Moment created successfully and will expire in 24 hours
 *                 moment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     image:
 *                       type: string
 *                     descripition:
 *                       type: string
 *       400:
 *         description: Missing image or description
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error while creating moment
 */
router.post("/moments",authMiddelWere,upload.single("image"),createMoment);
/**
 * @swagger
 * /user/friends:
 *   get:
 *     summary: Get all friends of the authenticated user
 *     tags:
 *       - Friends
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60f7ad94c2b6e4b55c1b4567"
 *                       fullName:
 *                         type: string
 *                         example: "John Doe"
 *                       userName:
 *                         type: string
 *                         example: "john_doe"
 *                       profilePic:
 *                         type: string
 *                         example: "https://cloudinary.com/images/user.png"
 *       401:
 *         description: Unauthorized - JWT token required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get('/friends', authMiddelWere, getAllFriends);

module.exports = router;