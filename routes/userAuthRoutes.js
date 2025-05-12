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
    sharePostWithFriend,
    getAllPosts,
    giveTedGoldToPost,
    giveTedSilverPost,
    giveTedBronzePost,
    giveTedBlackCoin,
    viewYourMoment,
    viewAllMoments,
    resendOtp,
    getViewYourMoment
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
 *     summary: Register a new user with profile and theme image upload.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - gender
 *               - dateBirth
 *               - fullName
 *               - email
 *               - phoneNo
 *             properties:
 *               gender:
 *                 type: string
 *               dateBirth:
 *                 type: string
 *                 format: date
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNo:
 *                 type: string
 *               profilePic:
 *                 type: string
 *                 format: binary
 *               theme:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User registered, OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/register', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'theme', maxCount: 1 },
  ]),register)
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
 *                 example: 1234
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
 *               - confirmPassword
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
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of hashtags to be added.
 *                 example: ["AI", "Startups"]
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

/**
 * @swagger
 * components:
 *   schemas:
 *     ConnectionFilter:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6639c9b9fcb8a0b93f3f6a45"
 *         userId:
 *           type: string
 *           description: User's MongoDB ID
 *           example: "6629aab5df1e8f1234567890"
 *         intrestedFiled:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Technology", "AI", "Music"]
 *         hashTag:
 *           type: array
 *           items:
 *             type: string
 *           example: ["#AI", "#Startups"]
 *         location:
 *           type: object
 *           properties:
 *             lattitude:
 *               type: number
 *               example: 22.5726
 *             longitude:
 *               type: number
 *               example: 88.3639
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-05-07T10:15:30Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-05-07T11:20:45Z"
 */

router.post("/connectionFilter", connectionFilter);
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
 *                 example: 1234
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
 *     summary: Request password reset
 *     description: Sends an OTP and a reset link to the user's email if the user exists.
 *     tags:
 *       - User
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
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP and reset link sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucess:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */

router.post("/forgetPassword", PasswordResetRequest);
/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Resets the user's password using a valid OTP sent to their email.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: integer
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newSecurePassword123
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
 *       400:
 *         description: Invalid OTP or expired
 *       500:
 *         description: Server error
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
 *                 example: "This is a post description"
 *               visibility:
 *                 type: boolean
 *                 example: true
 *               is_photography:
 *                 type: boolean
 *                 example: true
 *               hashTag:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nature", "sunset"]
 *               appliedFilter:
 *                 type: string
 *                 enum: [normal, clarendon, sepia, grayscale, lark, moon, aden, perpetua]
 *                 example: "clarendon"
 *               filteredImageUrl:
 *                 type: string
 *                 example: "https://cloudinary.com/filtered-image.jpg"
 *               token:
 *                 type: string
 *                 example: "your_jwt_token"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               colorMatrix:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [0.55, 0.3, 0.3, 0.0, 0.0, 0.3, 0.55, 0.3, 0.0, 0.0, 0.3, 0.3, 0.625, 0.0, 0.0375, 0.0, 0.0, 0.0, 1.0, 0.0]
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       403:
 *         description: Token mismatch or unauthorized
 *       500:
 *         description: Server error
 */

router.post("/createpost", authMiddelWere, upload.array("files", 10), createPost);
/**
 * @swagger
 * /user/share/{postId}/{friendId}:
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
router.post("/reportPost/:postId",authMiddelWere,report);
/**
 * @swagger
 * /user/moments:
 *   post:
 *     summary: Create a new moment with image(s) and description
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
 *             properties:
 *               descripition:
 *                 type: string
 *                 description: Description for the moment
 *                 example: "Beautiful sunset by the lake"
 *               is_closeFriends:
 *                 type: boolean
 *                 description: Is this moment for close friends only?
 *                 example: false
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 10 images
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
 *                   description: The created moment data
 *       200:
 *         description: Validation error
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
 *                   example: Image and description are required
 *       500:
 *         description: Server error while creating moment
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
 *                   example: Server error while creating moment
 */

router.post("/moments",authMiddelWere,upload.array('image',10),createMoment);
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
/**
 * @swagger
 * /user/allPost:
 *   get:
 *     summary: Get all posts created by the logged-in user
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       400:
 *         description: User not found or unauthorized
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
 *                   example: User Not found
 *       404:
 *         description: No posts found
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
 *                   example: No posts found
 *       500:
 *         description: Internal Server Error
 */
router.get("/allPost",authMiddelWere,getAllPosts);
/**
 * @swagger
 * /user/giveTedGoldcoin/{postId}:
 *   post:
 *     summary: Give a TedGold coin to a post (only one coin per user per post)
 *     tags:
 *       - Coins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to give a TedGold coin to
 *     responses:
 *       200:
 *         description: TedGold given successfully
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
 *                   example: TedGold given successfully
 *                 updatedTedGoldCount:
 *                   type: integer
 *                   example: 5
 *                 toUser:
 *                   type: string
 *                   example: 662a1d2b8e124ebfe41e8f77
 *       400:
 *         description: User has already given a coin to this post
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
 *                   example: You have already given a coin to this post
 *       404:
 *         description: Post or post owner not found
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
 *         description: Internal Server Error
 */

router.post("/giveTedGoldcoin/:postId",authMiddelWere,giveTedGoldToPost);
/**
 * @swagger
 * /user/giveTedSilvercoin/{postId}:
 *   post:
 *     summary: Give a TedSilver coin to a post (only one coin per user per post)
 *     tags:
 *       - Coins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to give a TedSilver coin to
 *     responses:
 *       200:
 *         description: TedSilver given successfully
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
 *                   example: TedSilver given successfully
 *                 updatedTedSilverCount:
 *                   type: integer
 *                   example: 3
 *                 toUser:
 *                   type: string
 *                   example: 662a1d2b8e124ebfe41e8f77
 *       400:
 *         description: User has already given a coin to this post
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
 *                   example: You have already given a coin to this post
 *       404:
 *         description: Post or post owner not found
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
 *         description: Internal Server Error
 */
router.post("/giveTedSilvercoin/:postId",authMiddelWere,giveTedSilverPost);
/**
 * @swagger
 * /user/giveTedBronzeCoin/{postId}:
 *   post:
 *     summary: Give a TedBronze coin to a post (only one coin per user per post)
 *     tags:
 *       - Coins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to give a TedBronze coin to
 *     responses:
 *       200:
 *         description: TedBronze given successfully
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
 *                   example: TedBronze given successfully
 *                 updatedTedBronzeCount:
 *                   type: integer
 *                   example: 2
 *                 toUser:
 *                   type: string
 *                   example: 662a1d2b8e124ebfe41e8f77
 *       400:
 *         description: User has already given a coin to this post
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
 *                   example: You have already given a coin to this post
 *       404:
 *         description: Post or post owner not found
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
 *         description: Internal Server Error
 */
router.post("/giveTedBronzeCoin/:postId",authMiddelWere,giveTedBronzePost);
router.post("/givetedBlackCoin/:postId",authMiddelWere,giveTedBlackCoin);
router.get("/getYourMoment",authMiddelWere,getViewYourMoment);
router.get("/getallmomets",authMiddelWere,viewAllMoments);
/**
 * @swagger
 * /user/resendOtp:
 *   post:
 *     summary: Resend OTP to a user's email
 *     tags:
 *       - Authentication
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
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP resent successfully
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
 *                   example: Otp Resend SucessFully
 *       400:
 *         description: Email not provided
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
 *                   example: please provide email
 *       404:
 *         description: User not found
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
 *                   example: User Not Found!
 *       500:
 *         description: Server error
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
 *                   example: error in resend-Otp Controller
 */
router.post("/resendOtp",resendOtp)

module.exports = router;