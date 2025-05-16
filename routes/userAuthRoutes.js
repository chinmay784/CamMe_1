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
    resendOtp,
    viewAMoment,
    getYourMoment,
    getAllMoments,
    authorizedUserMomentsViewersCount,
    authorizedUserMomentsViewers,
    deleteMoment,
    giveCommentToAnMomemt,
    replyToMomontComment,
    getAllCommentsWithReplies,
    getAllPost,
    getSinglePost,
    getAuthorizedUserPost,
    giveCommentToPost
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
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []  # if you're using JWT auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - visibility
 *               - token
 *               - email
 *             properties:
 *               description:
 *                 type: string
 *               visibility:
 *                 type: boolean
 *                 example: true
 *               is_photography:
 *                 type: boolean
 *                 example: true
 *               token:
 *                 type: string
 *               email:
 *                 type: string
 *               hashTag:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nature", "sunset"]
 *               appliedFilter:
 *                 type: string
 *                 example: grayscale
 *               filteredImageUrl:
 *                 type: string
 *               colorMatrix:
 *                 type: string
 *                 description: JSON stringified array of numbers. E.g. "[0.3, 0.6, 0.9]"
 *                 example: "[0.3, 0.6, 0.9]"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */

router.post("/createpost", authMiddelWere, upload.array("files", 10), createPost);
// /**
//  * @swagger
//  * /user/share/{postId}/{friendId}:
//  *   post:
//  *     summary: Share a post with a friend
//  *     tags:
//  *       - Posts
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: postId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID of the original post to share
//  *       - in: path
//  *         name: friendId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID of the friend to share the post with
//  *     responses:
//  *       200:
//  *         description: Post shared successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Post shared successfully your friend
//  *                 sharedPostId:
//  *                   type: string
//  *                   example: 6629a314d67d72a3a0989f4e
//  *                 originalPost:
//  *                   type: object
//  *                   description: Original post data
//  *       403:
//  *         description: Not a friend, sharing not allowed
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: Not a friend, so post Not share
//  *       404:
//  *         description: Post not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: Post not found
//  *       500:
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: Internal Server Error
//  */
router.post('/share/:postId/:friendId', authMiddelWere, sharePostWithFriend);
router.post("/reportPost/:postId",authMiddelWere,report);
/**
 * @swagger
 * /user/moments:
 *   post:
 *     summary: Create a new moment (story-like content that expires in 24 hours)
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
 *               - token
 *               - email
 *             properties:
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload one or more image files
 *               descripition:
 *                 type: string
 *                 description: Text description for the moment
 *               is_closeFriends:
 *                 type: boolean
 *                 description: Optional flag to show moment only to close friends
 *               token:
 *                 type: string
 *                 description: JWT token to validate against authorization header
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email to validate identity
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
 *                   $ref: '#/components/schemas/Moment'
 *       403:
 *         description: Token mismatch error
 *       200:
 *         description: Email mismatch or missing fields
 *       500:
 *         description: Server error while creating moment
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
/**
 * @swagger
 * /user/getYourMoment:
 *   post:
 *     summary: Get all moments created by the authenticated user
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 description: The same JWT token sent in the Authorization header
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Successfully fetched user's own moments
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
 *                   example: Fetched your moments
 *                 yourMoment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           profilePic:
 *                             type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Token mismatch
 *       500:
 *         description: Server error
 */
router.post("/getYourMoment",authMiddelWere,getYourMoment);
/**
 * @swagger
 * /user/getallmomets:
 *   post:
 *     summary: Get all moments with user information
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 description: The same JWT token sent in the Authorization header
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Successfully fetched all moments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 allMoments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           profilePic:
 *                             type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Token mismatch
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
 *                   example: Provided token does not match authorized token
 *       500:
 *         description: Server error
 */
router.post("/getallmomets",authMiddelWere,getAllMoments);
/**
 * @swagger
 * /user/viewMoment/{userId}/{momentId}:
 *   post:
 *     summary: View a specific moment by a user
 *     description: Allows a user to view another user's moment. If the viewer is not the owner and hasn't viewed the moment before, their userId is added to the moment's viewers.
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user who owns the moment
 *         schema:
 *           type: string
 *       - in: path
 *         name: momentId
 *         required: true
 *         description: ID of the moment to be viewed
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: viewer@example.com
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *     responses:
 *       200:
 *         description: Moment fetched successfully or with validation errors
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
 *                   example: Fetched single moment
 *                 viewersCount:
 *                   type: integer
 *                   example: 3
 *                 viewers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["userId1", "userId2"]
 *                 moment:
 *                   $ref: '#/components/schemas/Moment'
 *       403:
 *         description: Token mismatch error
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
 *                   example: Provided token does not match authorized token
 *       404:
 *         description: Moment not found
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
 *                   example: Moment not found for the given user
 *       500:
 *         description: Server error while viewing the moment
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
 *                   example: Internal server error in viewAMoment
 */
router.post("/viewMoment/:userId/:momentId",authMiddelWere,viewAMoment);
/**
 * @swagger
 * /user/authorizedUserMomentsViewersCount/{momentId}:
 *   post:
 *     summary: Get viewer count for a specific moment or all moments owned by the authorized user
 *     description: |
 *       Returns the total number of viewers for:
 *       - A specific moment (if `momentId` is provided in the path)
 *       - All moments owned by the authorized user (if no `momentId` is provided)
 *       
 *       Validates the email and token of the authorized user before returning viewer data.
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: momentId
 *         required: false
 *         description: ID of a specific moment (optional). If not provided, returns data for all moments.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *     responses:
 *       200:
 *         description: Viewer count retrieved successfully
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
 *                   example: Fetched viewer count for the specific moment
 *                 totalViewers:
 *                   type: integer
 *                   example: 5
 *                 momentId:
 *                   type: string
 *                   example: 663dfedb5f7a4b001f17ec81
 *                 momentsCount:
 *                   type: integer
 *                   example: 3
 *       403:
 *         description: Token mismatch
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
 *                   example: Provided token does not match authorized token
 *       404:
 *         description: Moment not found or not owned by the user
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
 *                   example: Moment not found or not owned by the authorized user
 *       500:
 *         description: Server error while fetching viewers count
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
 *                   example: Server error in authorizedUserMomentsViewersCount
 */
router.post("/authorizedUserMomentsViewersCount/:momentId",authMiddelWere,authorizedUserMomentsViewersCount);
/**
 * @swagger
 * /user/authorizedUserMomentsViewers/{momentId}:
 *   post:
 *     summary: Get viewers for a specific moment or all moments owned by the authorized user
 *     description: |
 *       Fetches all viewers:
 *       - For a specific moment (if `momentId` is provided in the path), or
 *       - Across all moments owned by the authorized user (if no `momentId` is provided)
 *       
 *       Viewers are populated with `userName` and `profilePic`. Email and token are validated against the authenticated user.
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: momentId
 *         required: false
 *         description: ID of a specific moment (optional). If not provided, returns viewers for all moments.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *     responses:
 *       200:
 *         description: Successfully retrieved moment viewers
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
 *                   example: Fetched viewers for the specific moment
 *                 viewers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 663dfedb5f7a4b001f17ec81
 *                       userName:
 *                         type: string
 *                         example: johndoe
 *                       profilePic:
 *                         type: string
 *                         example: https://example.com/avatar.jpg
 *                 momentId:
 *                   type: string
 *                   example: 663dfedb5f7a4b001f17ec81
 *                 momentsCount:
 *                   type: integer
 *                   example: 3
 *       403:
 *         description: Token mismatch
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
 *                   example: Provided token does not match authorized token
 *       404:
 *         description: Moment not found or not owned by user
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
 *                   example: Moment not found or not owned by the authorized user
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
 *                   example: Server error in authorizedUserMomentsViewers
 */
router.post("/authorizedUserMomentsViewers/:momentId",authMiddelWere,authorizedUserMomentsViewers);
/**
 * @swagger
 * /user/deleteMoment/{momentId}:
 *   delete:
 *     summary: Delete a specific moment owned by the authorized user
 *     description: |
 *       Deletes a moment if it belongs to the authorized user. Requires verification of the user's token and email.
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: momentId
 *         required: true
 *         description: ID of the moment to be deleted
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *     responses:
 *       200:
 *         description: Moment deletion result
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
 *                   example: Moment deleted successfully
 *       403:
 *         description: Token mismatch or unauthorized access
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
 *                   example: Provided token does not match authorized token
 *       404:
 *         description: Moment not found
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
 *                   example: Moment not found or not owned by the authorized user
 *       500:
 *         description: Server error during deletion
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
 *                   example: Server error in deleteMoment
 */
router.delete("/deleteMoment/:momentId",authMiddelWere,deleteMoment)
/**
 * @swagger
 * /user/giveCommentToAnMomemt/{momentId}:
 *   post:
 *     summary: Add a comment to a specific moment
 *     tags: [Moments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: momentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the moment to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *               - token
 *               - email
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Nice moment!"
 *               token:
 *                 type: string
 *                 example: "your-jwt-token"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Comment added successfully or error message
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
 *                   example: Comment added successfully
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "609e123456abcdef12345678"
 *                       comment:
 *                         type: string
 *                         example: "Nice moment!"
 *       500:
 *         description: Server error
 */
router.post("/giveCommentToAnMomemt/:momentId",authMiddelWere,giveCommentToAnMomemt);
/**
 * @swagger
 * /user/replyToMomontComment/{momentId}/{commentId}:
 *   post:
 *     summary: Reply to a comment on a specific moment
 *     tags: [Moments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: momentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the moment containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *               - email
 *               - token
 *             properties:
 *               reply:
 *                 type: string
 *                 example: "Thanks for your comment!"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               token:
 *                 type: string
 *                 example: "your-jwt-token"
 *     responses:
 *       200:
 *         description: Reply added successfully or error message
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
 *                   example: Reply added successfully.
 *                 updatedComment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     comment:
 *                       type: string
 *                     replies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           reply:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Server error
 */
router.post("/replyToMomontComment/:momentId/:commentId",authMiddelWere,replyToMomontComment)
/**
 * @swagger
 * /user/getAllCommentsWithReplies/{momentId}:
 *   post:
 *     summary: Get all comments and replies for a specific moment
 *     tags: [Moments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: momentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the moment to retrieve comments and replies for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: your-jwt-token
 *     responses:
 *       200:
 *         description: Successfully retrieved comments and replies
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
 *                   example: Fetched all comments and replies for the moment
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           profilePic:
 *                             type: string
 *                       comment:
 *                         type: string
 *                       replies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 userName:
 *                                   type: string
 *                                 profilePic:
 *                                   type: string
 *                             reply:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *       400:
 *         description: Moment ID is missing from the request
 *       404:
 *         description: Moment not found
 *       500:
 *         description: Server error while fetching comments and replies
 */
router.post("/getAllCommentsWithReplies/:momentId",authMiddelWere,getAllCommentsWithReplies)
/**
 * @swagger
 * /user/getAllPost:
 *   post:
 *     summary: Get all posts with user and coin count data
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # Assumes JWT Bearer token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Returns all posts with coin count and user info
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
 *                   example: Fetched all posts
 *                 allPosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 609c5ecf9d1d8b001fba14a7
 *                       description:
 *                         type: string
 *                       tedGoldCount:
 *                         type: integer
 *                         example: 3
 *                       tedSilverCount:
 *                         type: integer
 *                         example: 2
 *                       tedBronzeCount:
 *                         type: integer
 *                         example: 4
 *                       tedBlackCoinCount:
 *                         type: integer
 *                         example: 1
 *                       totalCoin:
 *                         type: integer
 *                         example: 425
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           profilePic:
 *                             type: string
 *                           email:
 *                             type: string
 *                       comments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 userName:
 *                                   type: string
 *                                 profilePic:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                             comment:
 *                               type: string
 *       401:
 *         description: Unauthorized or token mismatch
 *       500:
 *         description: Server error
 */
router.post("/getAllPost", authMiddelWere,getAllPost);
/**
 * @swagger
 * /user/getSinglePost/{postId}:
 *   post:
 *     summary: Get a single post by ID with coin counts
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # JWT token in Authorization header
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to retrieve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Returns the requested post with coin data
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
 *                   example: Fetched single post
 *                 post:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     description:
 *                       type: string
 *                     userId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         userName:
 *                           type: string
 *                         profilePic:
 *                           type: string
 *                         email:
 *                           type: string
 *                     tedGoldCount:
 *                       type: integer
 *                       example: 5
 *                     tedSilverCount:
 *                       type: integer
 *                       example: 2
 *                     tedBronzeCount:
 *                       type: integer
 *                       example: 3
 *                     tedBlackCoinCount:
 *                       type: integer
 *                       example: 1
 *                     totalCoin:
 *                       type: integer
 *                       example: 525
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               userName:
 *                                 type: string
 *                               profilePic:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           comment:
 *                             type: string
 *       401:
 *         description: Unauthorized or token mismatch
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post("/getSinglePost/:postId",authMiddelWere,getSinglePost)
/**
 * @swagger
 * /user/getAuthorizedUserPost:
 *   post:
 *     summary: Get all posts created by the authorized user
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # JWT token in Authorization header
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
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (optional if not using token verification)
 *     responses:
 *       200:
 *         description: Returns all posts made by the authorized user
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
 *                   example: Fetched all posts for the authorized user
 *                 userPosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       description:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           profilePic:
 *                             type: string
 *                           email:
 *                             type: string
 *                       comments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 userName:
 *                                   type: string
 *                                 profilePic:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                             comment:
 *                               type: string
 *       401:
 *         description: Unauthorized or email mismatch
 *       500:
 *         description: Server error while fetching posts
 */
router.post("/getAuthorizedUserPost",authMiddelWere,getAuthorizedUserPost);
/**
 * @swagger
 * /user/giveCommentToPost/{postId}:
 *   post:
 *     summary: Add a comment to a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # JWT token in Authorization header
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *               - email
 *               - token
 *             properties:
 *               comment:
 *                 type: string
 *                 example: This is a great post!
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Comment added successfully or relevant validation message
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
 *                   example: Comment added successfully
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       comment:
 *                         type: string
 *       400:
 *         description: Bad request due to missing comment or postId
 *       500:
 *         description: Server error while adding comment to post
 */
router.post("/giveCommentToPost/:postId",authMiddelWere,giveCommentToPost)

/**
 * @swagger
 * /user/giveTedGoldcoin/{postId}:
 *   post:
 *     summary: Give TedGold to a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # JWT token in Authorization header
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to give TedGold to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: TedGold given successfully or validation failed
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
 *                   type: number
 *                   example: 1
 *                 toUser:
 *                   type: string
 *                   example: 64f123456abcde7890f12345
 *       400:
 *         description: Missing postId or other required information
 *       500:
 *         description: Internal Server Error while giving TedGold
 */
router.post("/giveTedGoldcoin/:postId",authMiddelWere,giveTedGoldToPost);

/**
 * @swagger
 * /user/giveTedSilvercoin/{postId}:
 *   post:
 *     summary: Give TedSilver to a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # Requires JWT token in Authorization header
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to give TedSilver to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: TedSilver given successfully or validation failed
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
 *                   type: number
 *                   example: 1
 *                 toUser:
 *                   type: string
 *                   example: 64f123456abcde7890f12345
 *       400:
 *         description: Missing postId or other required fields
 *       500:
 *         description: Internal Server Error while giving TedSilver
 */
router.post("/giveTedSilvercoin/:postId",authMiddelWere,giveTedSilverPost);

/**
 * @swagger
 * /user/giveTedBronzeCoin/{postId}:
 *   post:
 *     summary: Give TedBronze to a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []  # JWT Token required
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to give TedBronze to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: TedBronze given successfully or validation failed
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
 *                   type: number
 *                   example: 1
 *                 toUser:
 *                   type: string
 *                   example: 64f123456abcde7890f12345
 *       400:
 *         description: Bad Request or missing fields
 *       500:
 *         description: Internal Server Error
 */
router.post("/giveTedBronzeCoin/:postId",authMiddelWere,giveTedBronzePost);
router.post("/givetedBlackCoin/:postId",authMiddelWere,giveTedBlackCoin);

module.exports = router;