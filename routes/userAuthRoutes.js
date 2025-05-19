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
  giveCommentToPost,
  getAuthorizedUserPhotoGraphy
} = require("../controllers/userAuthController")
const { authMiddelWere } = require('../middelwere/authMiddelWere');
const { uploadd } = require("../middelwere/multer");
const checkBlacklist = require('../middelwere/BlackListToken');
const { upload } = require("../config/cloudinary")

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
]), register)
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
router.post("/addAccount", authMiddelWere, addAccount)
router.get("/account-link/approve/:userId/:requesterId", approveLinkAccount);
router.post("/account-link/verify-otp", finalizeLinkAccount);
router.post("/account-link/reject/:userId/:requesterId", rejectLinkAccount);
router.post("/logout", checkBlacklist, logoutUser);
router.get("/getMatchIntrested", authMiddelWere, getMatchedIntrested);
router.get("/getHashTagContent", authMiddelWere, getHashTagContent);
router.get("/getLocation", authMiddelWere, getAllowLocation);
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
router.post("/reportPost/:postId", authMiddelWere, report);
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


router.post("/moments", authMiddelWere, upload.array('image', 10), createMoment);
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
router.post("/resendOtp", resendOtp)
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
router.post("/getYourMoment", authMiddelWere, getYourMoment);
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
router.post("/getallmomets", authMiddelWere, getAllMoments);
/**
 * @swagger
 * /user/viewMoment:
 *   post:
 *     summary: View a single moment by its ID and record viewer
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Provide email, token, userId of moment owner, and optional momentId to view a specific moment
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - userId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the authenticated user (viewer)
 *               token:
 *                 type: string
 *                 description: JWT token for authorization
 *               userId:
 *                 type: string
 *                 description: ID of the moment owner
 *               momentId:
 *                 type: string
 *                 description: (Optional) ID of the specific moment to view
 *     responses:
 *       200:
 *         description: Moment fetched successfully or relevant failure message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 viewersCount:
 *                   type: integer
 *                   description: Number of viewers of the moment
 *                   nullable: true
 *                 viewers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of user IDs who viewed the moment
 *                   nullable: true
 *                 moment:
 *                   type: object
 *                   description: The moment document details
 *                   nullable: true
 *       403:
 *         description: Token mismatch error
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/viewMoment", authMiddelWere, viewAMoment);
/**
 * @swagger
 * /user/authorizedUserMomentsViewersCount:
 *   post:
 *     summary: Get viewer counts for authorized user's moments
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Provide email, token, and optionally momentId to fetch viewer count for a specific moment or all moments
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
 *                 description: Email of the authorized user
 *               token:
 *                 type: string
 *                 description: JWT token for authorization
 *               momentId:
 *                 type: string
 *                 description: (Optional) Moment ID to get viewers count for a specific moment
 *     responses:
 *       200:
 *         description: Viewer count fetched successfully or relevant info message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 totalViewers:
 *                   type: integer
 *                   description: Total number of unique viewers
 *                   nullable: true
 *                 momentId:
 *                   type: string
 *                   description: Moment ID if queried specifically
 *                   nullable: true
 *                 momentsCount:
 *                   type: integer
 *                   description: Total number of moments for the authorized user (when no momentId provided)
 *                   nullable: true
 *       403:
 *         description: Token mismatch error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Moment not found or not owned by the user
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/authorizedUserMomentsViewersCount", authMiddelWere, authorizedUserMomentsViewersCount);
/**
 * @swagger
 * /user/authorizedUserMomentsViewers:
 *   post:
 *     summary: Get unique viewers of authorized user's moments
 *     tags:
 *       - Moments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Provide email, token, and optionally momentId to fetch viewers for a specific moment or all moments
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
 *                 description: Email of the authorized user
 *               token:
 *                 type: string
 *                 description: JWT token for authorization
 *               momentId:
 *                 type: string
 *                 description: (Optional) Moment ID to get viewers for a specific moment
 *     responses:
 *       200:
 *         description: Viewers fetched successfully or relevant info message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 viewers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       profilePic:
 *                         type: string
 *                   description: List of unique viewers
 *                 momentId:
 *                   type: string
 *                   description: Moment ID if queried specifically
 *                   nullable: true
 *                 momentsCount:
 *                   type: integer
 *                   description: Total moments count (when no momentId provided)
 *                   nullable: true
 *       403:
 *         description: Token mismatch error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Moment not found or not owned by the user
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/authorizedUserMomentsViewers", authMiddelWere, authorizedUserMomentsViewers);
/**
 * @swagger
 * /user/deleteMoment:
 *   delete:
 *     summary: Delete a specific moment owned by the authorized user
 *     description: >
 *       Deletes a moment if it belongs to the authorized user.
 *       Requires verification of the user's token and email.
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
 *               - momentId
 *               - email
 *               - token
 *             properties:
 *               momentId:
 *                 type: string
 *                 description: ID of the moment to be deleted
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email of the authorized user
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *                 description: JWT token for authorization
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
router.delete("/deleteMoment", authMiddelWere, deleteMoment)
/**
 * @swagger
 * /user/giveCommentToAnMomemt:
 *   post:
 *     summary: Add a comment to a specific moment
 *     description: |
 *       Allows an authorized user to add a comment to a moment.
 *       Requires valid token and email verification.
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
 *               - momentId
 *               - comment
 *               - email
 *               - token
 *             properties:
 *               momentId:
 *                 type: string
 *                 description: ID of the moment to comment on
 *               comment:
 *                 type: string
 *                 description: Comment text to add
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email of the authorized user
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *                 description: JWT token for authorization
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
 *                   description: Updated list of comments on the moment
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         description: ID of the user who commented
 *                       comment:
 *                         type: string
 *                         description: Comment text
 *       500:
 *         description: Server error while adding comment
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
 *                   example: Server error in giveCommentToAMomemt
 */
router.post("/giveCommentToAnMomemt", authMiddelWere, giveCommentToAnMomemt);
/**
 * @swagger
 * /user/replyToMomontComment:
 *   post:
 *     summary: Reply to a comment on a specific moment
 *     description: |
 *       Allows an authorized user to reply to a comment on a moment.
 *       Requires valid token and email verification.
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
 *               - momentId
 *               - commentId
 *               - reply
 *               - email
 *               - token
 *             properties:
 *               momentId:
 *                 type: string
 *                 description: ID of the moment containing the comment
 *               commentId:
 *                 type: string
 *                 description: ID of the comment to reply to
 *               reply:
 *                 type: string
 *                 description: Reply text to add
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email of the authorized user
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *                 description: JWT token for authorization
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
 *                   description: The updated comment with new replies
 *       500:
 *         description: Server error while adding reply
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
 *                   example: Server error while replying to comment.
 */
router.post("/replyToMomontComment", authMiddelWere, replyToMomontComment)
/**
 * @swagger
 * /user/getAllCommentsWithReplies:
 *   post:
 *     summary: Get all comments and their replies for a specific moment
 *     description: |
 *       Fetches all comments along with their replies for the given moment.
 *       Requires token and email verification for the authorized user.
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
 *               - momentId
 *               - email
 *               - token
 *             properties:
 *               momentId:
 *                 type: string
 *                 description: ID of the moment to fetch comments from
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email of the authorized user
 *               token:
 *                 type: string
 *                 example: your-auth-token
 *                 description: JWT token for authorization
 *     responses:
 *       200:
 *         description: Comments and replies fetched successfully
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
 *                     description: Comment object with replies and user info
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
 *                   example: Moment not found
 *       500:
 *         description: Server error while fetching comments and replies
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
 *                   example: Server error while fetching comments and replies
 */
router.post("/getAllCommentsWithReplies", authMiddelWere, getAllCommentsWithReplies)
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
router.post("/getAllPost", authMiddelWere, getAllPost);
/**
 * @swagger
 * /user/getSinglePost:
 *   post:
 *     summary: Fetch a single post by postId after validating token and email
 *     tags:
 *       - Posts
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
 *               - postId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               postId:
 *                 type: string
 *                 example: 6644920a4ad4cc66aaae6131
 *     responses:
 *       200:
 *         description: Successfully fetched single post
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
 *                       example: 6644920a4ad4cc66aaae6131
 *                     userId:
 *                       type: object
 *                       properties:
 *                         userName:
 *                           type: string
 *                           example: Chinmay
 *                         profilePic:
 *                           type: string
 *                           example: "https://example.com/profile.jpg"
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                     tedGoldCount:
 *                       type: integer
 *                       example: 2
 *                     tedSilverCount:
 *                       type: integer
 *                       example: 1
 *                     tedBronzeCount:
 *                       type: integer
 *                       example: 0
 *                     tedBlackCoinCount:
 *                       type: integer
 *                       example: 0
 *                     totalCoin:
 *                       type: integer
 *                       example: 200
 *       500:
 *         description: Server error while fetching single post
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
 *                   example: Server error while fetching single post
 */
router.post("/getSinglePost", authMiddelWere, getSinglePost)
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
router.post("/getAuthorizedUserPost", authMiddelWere, getAuthorizedUserPost);
/**
 * @swagger
 * /user/giveCommentToPost:
 *   post:
 *     summary: Add a comment to a post after verifying token and email
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Comment details with postId, email, and token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - comment
 *               - email
 *               - token
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6644920a4ad4cc66aaae6131
 *               comment:
 *                 type: string
 *                 example: This is a great post!
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Comment added successfully or validation error message
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Comment added successfully
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: 6644920a4ad4cc66aaae6131
 *                           comment:
 *                             type: string
 *                             example: This is a great post!
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: Provided token does not match authorized token
 *       500:
 *         description: Server error while adding comment
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
 *                   example: server error while adding comment to post
 */
router.post("/giveCommentToPost", authMiddelWere, giveCommentToPost)
/**
 * @swagger
 * /user/giveTedGoldcoin:
 *   post:
 *     summary: Give a TedGold coin to a post after verifying token and email
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Details required to give TedGold coin to a post
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - email
 *               - token
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6644920a4ad4cc66aaae6131
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: TedGold coin given successfully or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: TedGold given successfully
 *                     updatedTedGoldCount:
 *                       type: integer
 *                       example: 5
 *                     toUser:
 *                       type: string
 *                       example: 6644920a4ad4cc66aaae6131
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: You have already given a coin to this post
 *       500:
 *         description: Internal server error while giving TedGold coin
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
 *                   example: Internal Server Error in giveTedGoldToPost
 */
router.post("/giveTedGoldcoin", authMiddelWere, giveTedGoldToPost);
/**
 * @swagger
 * /user/giveTedSilvercoin:
 *   post:
 *     summary: Give a TedSilver coin to a post after verifying token and email
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Details required to give TedSilver coin to a post
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - email
 *               - token
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6644920a4ad4cc66aaae6131
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: TedSilver coin given successfully or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: TedSilver given successfully
 *                     updatedTedSilverCount:
 *                       type: integer
 *                       example: 3
 *                     toUser:
 *                       type: string
 *                       example: 6644920a4ad4cc66aaae6131
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: You have already given a coin to this post
 *       500:
 *         description: Internal server error while giving TedSilver coin
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
 *                   example: error in giveTedSilverPost controller
 */
router.post("/giveTedSilvercoin", authMiddelWere, giveTedSilverPost);
/**
 * @swagger
 * /user/giveTedBronzeCoin:
 *   post:
 *     summary: Give a TedBronze coin to a post
 *     tags:
 *       - Posts
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
 *               - postId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *               postId:
 *                 type: string
 *                 description: The ID of the post to give the coin to
 *     responses:
 *       200:
 *         description: Coin given successfully or failure reason
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedTedBronzeCount:
 *                   type: integer
 *                   nullable: true
 *                 toUser:
 *                   type: string
 *                   nullable: true
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

router.post("/giveTedBronzeCoin", authMiddelWere, giveTedBronzePost);
router.post("/getAuthorizedUserPhotoGraphy",authMiddelWere, getAuthorizedUserPhotoGraphy);
router.post("/givetedBlackCoin/:postId", authMiddelWere, giveTedBlackCoin);

/**
 * @swagger
 * /user/inviteAFriend:
 *   post:
 *     summary: Send a friend request to another user
 *     description: |
 *       Allows an authenticated user to send a friend request to another user by their ID.
 *       Verifies the JWT token and email before proceeding. Also checks if a request has already been sent.
 *     tags:
 *       - Friends
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
 *               - reciverId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Authenticated user's email for verification
 *               token:
 *                 type: string
 *                 example: your-jwt-token
 *                 description: JWT token to verify user identity
 *               reciverId:
 *                 type: string
 *                 example: 66512f6bbec36e0a27d44891
 *                 description: ID of the user to whom the friend request is being sent
 *     responses:
 *       200:
 *         description: Friend request sent or already sent
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
 *                   example: Friend request sent
 *       403:
 *         description: Provided token does not match authorized token
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
 *         description: Server error while sending friend request
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
 *                   example: Error in inviteAFriend Route
 */
router.post("/inviteAFriend", authMiddelWere, sendFriendRequest);
/**
 * @swagger
 * user/acceptFriendRequest:
 *   post:
 *     summary: Accept a friend request
 *     description: |
 *       Allows an authenticated user to accept a pending friend request.
 *       Validates JWT token, user email, and the friend request ID.
 *     tags:
 *       - Friends
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
 *               - requestId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Authenticated user's email
 *               token:
 *                 type: string
 *                 example: your-jwt-token
 *                 description: JWT token from Authorization header
 *               requestId:
 *                 type: string
 *                 example: 6651356cf913ff4e09cc3cde
 *                 description: ID of the friend request to accept
 *     responses:
 *       200:
 *         description: Friend request accepted or validation error
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
 *                   example: Friend request accepted
 *       403:
 *         description: Provided token does not match authorized token
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
 *         description: Server error while accepting the friend request
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
 *                   example: Error in acceptRequest controller
 */
router.post("/acceptFriendRequest", authMiddelWere, acceptFriendRequest);

module.exports = router;