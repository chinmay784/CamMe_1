const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodeMailer = require("nodemailer");
const User = require("../models/userModel");
const twilio = require("twilio");
const BlacklistedToken = require("../models/BlacklistedToken");
const ConnectionFilter = require("../models/connectionFilterModel");
const FriendRequest = require("../models/friendRequestSchema");
const Postcreate = require("../models/PostModel");
const cloudinary = require("cloudinary")
const mongoose = require("mongoose");
const Moment = require("../models/momentSchema")
const fs = require("fs");
const Notification = require("../models/notificationmodel")
const admin = require("../firebase")
const TedBlackers = require("../models/TedBlackersModel")

const transPorter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});





const twilioClient = twilio("AC3b5a0ffcf57ed5420c290c45e7623e9a", "67553f9d84ce300ed02ab5e7e130dff0")


const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();


exports.register = async (req, res) => {
    try {
        const { gender, dateBirth, fullName, email, phoneNo } = req.body;

        if (!gender || !dateBirth || !fullName || !email || !phoneNo) {
            return res.status(200).json({
                success: false,
                message: 'All fields are required',
            });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(200).json({
                success: false,
                message: 'User already exists',
            });
        }

        const otp = generateOtp();
        const otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes


        // Upload profilePic
        let profilePicUrl = `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
        if (req.files.profilePic) {
            const profileUpload = await cloudinary.uploader.upload(req.files.profilePic[0].path, {
                folder: 'profile_pics',
            });
            profilePicUrl = profileUpload.secure_url;
        }

        // Upload theme image
        let themeUrl = '';
        if (req.files.theme) {
            const themeUpload = await cloudinary.uploader.upload(req.files.theme[0].path, {
                folder: 'profile_pics'
            });
            themeUrl = themeUpload.secure_url;
        }

        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit
        const userName = `${fullName.split(' ')[0].toLowerCase()}${randomSuffix}`;

        let genderval = gender.toLowerCase()
        let fullNameval = fullName.toLowerCase()

        user = new User({
            gender,
            theme: themeUrl,
            profilePic: profilePicUrl,
            fullName,
            dateBirth,
            email,
            phoneNo,
            otp,
            otpExpires,
            userName,
            fcmToken: randomSuffix,
        });

        await user.save();

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify your email - OTP',
            text: `Your OTP for email verification is: ${otp}`,
        };

        await transPorter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email and phone number',
        });

    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            success: false,
            message: 'Error in register User controller',
        });
    }
};



exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(200).json({
                sucess: false,
                message: "please provide email"
            })
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                sucess: false,
                message: "User Not Found!"
            })
        }

        const otp = generateOtp();
        const otpExpires = Date.now() + 10 * 60 * 200;

        user.otp = otp;
        user.otpExpires = otpExpires;


        await user.save();

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Resend - OTP",
            text: `Your OTP for Resend Otp  is: ${otp}`,
        };

        await transPorter.sendMail(mailOptions);

        return res.status(200).json({
            sucess: true,
            message: "Otp Resend SucessFully"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            sucess: false,
            message: "error in resend-Otp Controller"
        })
    }
}



exports.otpVerify = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(200).json({
                sucess: false,
                message: 'Please provide all details'
            })
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                sucess: false,
                message: "User Not Found"
            })
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(200).json({
                sucess: false,
                message: "Invalid Or  Expired OTP"
            })
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;


        await user.save()

        return res.status(200).json({
            sucess: true,
            message: "OTP verified. Account Activated",
            user,
        })
    } catch (error) {
        console.log("error in Otpverify ", error.message)
        return res.status(500).json({
            sucess: false,
            message: "Error in verify otp controller"
        })
    }
}



exports.ProfileCreation = async (req, res) => {
    try {
        const { email, password, userName } = req.body;

        if (!userName || !email || !password) {
            return res.status(200).json({
                success: false,
                message: 'Please provide all details'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found'
            });
        }

        user.userName = ""


        // ✅ hash and update password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.userName = userName
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile Creation Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error in Profile Creation controller'
        });
    }
}




exports.connectionFilter = async (req, res) => {
    try {
        const { email, intrest, hashTag, lattitude, longitude } = req.body;

        if (!email) {
            return res.status(200).json({
                success: false,
                message: "Please enter an email",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const userId = user._id;

        let connection = await ConnectionFilter.findOne({ userId });

        const locationData = (
            typeof lattitude === 'number' &&
            typeof longitude === 'number'
        ) ? {
            lattitude,
            longitude
        } : undefined;

        if (!connection) {
            // Create new filter
            connection = new ConnectionFilter({
                userId,
                intrestedFiled: Array.isArray(intrest) ? intrest : intrest ? [intrest] : [],
                hashTag: Array.isArray(hashTag) ? hashTag : hashTag ? [hashTag] : [],
                location: locationData,
            });
        } else {
            // Ensure arrays exist before pushing
            if (!Array.isArray(connection.intrestedFiled)) {
                connection.intrestedFiled = [];
            }
            if (!Array.isArray(connection.hashTag)) {
                connection.hashTag = [];
            }

            // if (intrest && !connection.intrestedFiled.includes(intrest)) {
            //     connection.intrestedFiled.push(intrest);
            // }

            if (intrest) {
                const int = Array.isArray(intrest) ? intrest : [intrest];
                int.forEach((i) => {
                    if (!connection.intrestedFiled.includes(i)) {
                        connection.intrestedFiled.push(i)
                    }
                })
            }

            if (hashTag) {
                const tags = Array.isArray(hashTag) ? hashTag : [hashTag];
                tags.forEach(tag => {
                    if (!connection.hashTag.includes(tag)) {
                        connection.hashTag.push(tag);
                    }
                });
            }

            if (locationData) {
                connection.location = locationData; // Overwrite location
            }
        }

        await connection.save();

        return res.status(200).json({
            success: true,
            message: "Connection filter saved successfully",
            connection,
        });

    } catch (error) {
        console.error("Error in connectionFilter:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in connection filter controller",
        });
    }
};






exports.login = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        if (!userName || !email || !password) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide all details",
            })
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                sucess: "false",
                message: "User is not register"
            })
        };


        if (!user.isVerified) {
            return res.status(200).json({
                message: "Please verify your email first"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(200).json({
                message: "Please Enter Correct password",
            })
        }



        const otp = generateOtp();
        const otpExpires = Date.now() + 10 * 60 * 200;



        user.otp = otp;
        user.otpExpires = otpExpires

        await user.save()

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "User Login with - OTP",
            text: `Your OTP for Login verification is: ${otp}`,
        };

        await transPorter.sendMail(mailOptions)

        // await twilioClient.messages.create({
        //     body: `Your OTP for Login verification is: ${otp}`,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: user.phoneNo,
        // })

        return res.status(200).json({
            sucess: true,
            message: "OTP sent to your email and phone number",
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Error in login controller"
        })
    }
}



exports.loginOtpverify = async (req, res) => {
    try {
        const { email, otp, fcmToken } = req.body;

        if (!email || !otp || !fcmToken) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide all details"
            })
        };

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                sucess: false,
                message: "User Not Found"
            })
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(200).json({
                sucess: false,
                message: "Invalid Or  Expired OTP"
            })
        }

        const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "2d" });

        user.otp = undefined;
        user.otpExpires = undefined;
        user.fcmToken = fcmToken;
        await user.save()

        return res.status(200).json({
            sucess: true,
            message: "Login Otp Verify ",
            user,
            token
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "error in loginverifyOtp controller"
        })
    }
}



exports.getConnectionFilter = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(200).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const userId = user._id;

        const getData = await ConnectionFilter.findOne({ userId });

        if (!getData) {
            return res.status(200).json({
                success: false,
                message: "No connection filter found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            data: getData,
        });

    } catch (error) {
        console.error("Error in getConnectionFilter:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in getConnectionFilter controller",
        });
    }
};



exports.PasswordResetRequest = async (req, res) => {
    try {
        const { email } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                sucess: false,
                message: "User Not Found ! using email"
            })
        }


        const otp = generateOtp();
        const expiry = Date.now() + 60 * 60 * 1000; // 1hour 


        user.otp = otp;
        user.resetTokenExpiry = expiry;
        await user.save();

        const resetLink = `https://camme-1-1.onrender.com/reset-window?email=${email}`;
        // `http://localhost:4000/reset-window?email=${email}`;

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
              <p>Your OTP is: <strong>${otp}</strong></p>
              <p>Or click <a href="${resetLink}" target="_blank">here to reset your password</a>.</p>
            `,
        };

        await transPorter.sendMail(mailOptions)



        res.json({
            sucess: true,
            message: 'OTP and reset link sent to email '
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            sucess: false,
            message: "Error in PasswordResetRequest controller"
        })
    }
}



exports.resetPassword = async (req, res) => {
    try {
        const { newPassword, otp, email } = req.body;

        const user = await User.findOne({ email })

        if (user.otp !== otp || user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid OTP or expired' });
        }

        // ✅ hash and update password
        const salt = await bcrypt.genSalt(10);



        user.password = await bcrypt.hash(newPassword, salt)
        user.otp = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.status(200).json({
            sucess: true,
            message: "Password reset successful"
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            sucess: false,
            message: "Error in resetPassword controller"
        })
    }
}





exports.addAccount = async (req, res) => {
    try {
        const { userName, email, phoneNo, password } = req.body;
        const mainUserId = req.user.userId; // from JWT middleware
        const main = await User.findById(mainUserId)


        const secondaryAccount = await User.findOne({ $or: [{ email }, { phoneNo }] });
        if (!secondaryAccount) {
            return res.status(200).json({ message: "Secondary account not found." });
        }


        if (secondaryAccount._id.toString() === mainUserId) {
            return res.status(200).json({ message: "You cannot link your own account." });
        }


        const isMatch = await bcrypt.compare(password, secondaryAccount.password);
        if (!isMatch) {
            return res.status(200).json({ message: "Invalid password for the secondary account." });
        }

        const existingRequest = secondaryAccount.linkRequests.find(
            (r) => r.requesterId.toString() === mainUserId && r.status === 'pending'
        );
        if (existingRequest) {
            return res.status(200).json({ message: "A link request has already been sent." });
        }


        // Step 6: Generate approve/reject URLs
        const approveLink = `https://camme-1-1.onrender.com/api/v1/user/account-link/approve/${secondaryAccount._id}/${mainUserId}`;
        const rejectLink = `https://camme-1-1.onrender.com/api/v1/user/account-link/reject/${secondaryAccount._id}/${mainUserId}`;

        const emailContent = `
      <p><strong>${req.user.fullName}</strong> is trying to link your account.</p>
      <p>Do you want to allow this?</p>
      <a href="${approveLink}" style="padding:10px 20px;background-color:green;color:white;text-decoration:none;margin-right:10px;">Allow</a>
      <a href="${rejectLink}" style="padding:10px 20px;background-color:red;color:white;text-decoration:none;">Reject</a>
    `;

        const smsContent = `Link Request: ${req.user.fullName} wants to link your account. Approve: ${approveLink} | Reject: ${rejectLink}`;

        // Step 7: Send Email
        await transPorter.sendMail({
            from: process.env.SMTP_USER,
            to: secondaryAccount.email,
            subject: "New Account Linking Request",
            html: emailContent
        });

        // Step 8: Send SMS
        // await twilioClient.messages.create({
        //     body: smsContent,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: secondaryAccount.phoneNo,
        // });

        // Step 9: Return response
        return res.status(200).json({
            message: "Approval email & SMS sent to secondary user.",
            secondaryAccount,
            main
        });

    } catch (error) {
        console.error("AddAccount Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error in addAccount controller"
        });
    }
};


exports.approveLinkAccount = async (req, res) => {
    try {
        const { userId, requesterId } = req.params;

        const user = await User.findById(userId);



        const otp = generateOtp();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

        user.otp = otp;
        user.otpExpires = otpExpires;

        await user.save();

        await transPorter.sendMail({
            from: process.env.SMTP_USER,
            to: user.email,
            subject: "OTP for Linking Account",
            html: `<p>Your OTP to confirm the account link: <b>${otp}</b></p>`
        });


        // await twilioClient.messages.create({
        //     body: `Your OTP for linking account: ${otp}`,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: user.phoneNo,
        // });

        return res.status(200).json({ message: "OTP sent. Please verify to complete linking." });

    } catch (error) {
        console.error("Approve Link Error:", error.message);
        return res.status(500).json({ message: "Server Error" });
    }
};



exports.finalizeLinkAccount = async (req, res) => {
    try {
        const { userId, requesterId, otp } = req.body;

        const user = await User.findById(userId);


        if (user.otp !== otp || Date.now() > user.otpExpires) {
            return res.status(200).json({ message: "Invalid or expired OTP." });
        }


        user.status = 'approved';
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();


        const mainUser = await User.findById(requesterId);

        mainUser.linkRequests.push({ requesterId: userId });

        await mainUser.save();

        res.status(200).json({ message: "Account successfully linked.", mainUser });

    } catch (err) {
        console.error("Finalize Link Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};



exports.rejectLinkAccount = async (req, res) => {
    try {
        const { userId, requesterId } = req.params;

        const user = await User.findById(userId);
        const request = user.linkRequests.find(
            (r) => r.requesterId.toString() === requesterId && r.status === 'pending'
        );

        if (!request) return res.status(200).json({ message: "No pending request found." });

        request.status = 'rejected';
        await user.save();

        res.status(200).json({ message: "Linking request rejected." });

    } catch (err) {
        console.error("Reject Link Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};




exports.logoutUser = async (req, res) => {
    try {
        const token = req.header("Authorization"); // Bearer <token>
        if (!token) return res.status(200).json({ message: "Token not provided." });

        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000); // JWT exp is in seconds

        const blacklisted = new BlacklistedToken({ token, expiresAt });
        await blacklisted.save();

        const user = await User.findById(req.user.userId);
        const { password } = req.body;
        // if(user.password === )
        const isMatch = bcrypt.compare(user.password, password);

        if (!isMatch) {
            return re.status(200).json({
                sucess: false,
                message: "user Password and input password is not match"
            })
        }

        return res.status(200).json({ message: "User logged out successfully." });

    } catch (err) {
        console.error("Logout Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};



exports.getMatchedIntrested = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const userFilter = await ConnectionFilter.findOne({ userId: user._id });
        if (!userFilter) {
            return res.status(200).json({
                success: false,
                message: "User's interest filter not found",
            });
        }

        const userInterestedFields = userFilter.intrestedFiled; // Already an array of strings

        if (!userInterestedFields || userInterestedFields.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No interests found for this user",
                matchedUsers: [],
            });
        }

        const matchedFilters = await ConnectionFilter.find({
            userId: { $ne: user._id }, // Exclude current user
            intrestedFiled: { $in: userInterestedFields },
        }).populate("userId"); // Populate user details

        return res.status(200).json({
            success: true,
            userInterestedFields,
            matchedUsers: matchedFilters,
        });

    } catch (error) {
        console.error("Error in getMatchedIntrested:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error in getMatchedIntrested",
        });
    }
};




exports.getHashTagContent = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        // Get the logged-in user's filter
        const userFilter = await ConnectionFilter.findOne({ userId: user._id });
        if (!userFilter) {
            return res.status(200).json({
                success: false,
                message: "User's hashtag filter not found",
            });
        }

        const userHashTags = userFilter.hashTag; // this is already an array of strings

        if (!userHashTags || userHashTags.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No hashtags found for this user",
                tags: [],
            });
        }

        // Find other users who have at least one matching hashtag
        const matchedFilters = await ConnectionFilter.find({
            userId: { $ne: user._id },
            hashTag: { $in: userHashTags },
        });

        // Collect all matching hashtags from those users
        const matchedTags = matchedFilters.flatMap(filter =>
            filter.hashTag.filter(tag => userHashTags.includes(tag))
        );

        const uniqueTags = [...new Set(matchedTags)];

        return res.status(200).json({
            success: true,
            matchedTags: uniqueTags,
        });

    } catch (error) {
        console.error("Error in getHashTagContent:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in getHashTagContent",
        });
    }
};





exports.getAllowLocation = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const userFilter = await ConnectionFilter.findOne({ userId: user._id });
        if (!userFilter) {
            return res.status(200).json({
                success: false,
                message: "User's location filter not found",
            });
        }

        const userLocation = userFilter.location;

        const matchedFilters = await ConnectionFilter.find({
            userId: { $ne: user._id },
            "location.lattitude": userLocation.lattitude,
            "location.longitude": userLocation.longitude,
        }).populate("userId");

        return res.status(200).json({
            success: true,
            matchedFilters,
        });
    } catch (error) {
        console.error("Error in getAllowLocation:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in getAllowLocation",
        });
    }
};




exports.sendFriendRequest = async (req, res) => {
    try {
        const user = req.user.userId

        const { email, token, reciverId } = req.body;

        //const { reciverId } = req.params;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(user).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        };

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        };

        if (!reciverId) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provid InviteUserId"
            })
        }

        const isExistingRequest = await FriendRequest.findOne({
            sender: user,
            receiver: reciverId,
            status: "pending"
        })

        if (isExistingRequest) {
            return res.status(200).json({
                sucess: false,
                message: "Friend Request Already Send"
            })
        }

        const request = await FriendRequest.create({
            sender: user,
            receiver: reciverId
        });

        const receiverSocketId = global.onlineUsers.get(reciverId.toString());

        if (receiverSocketId) {
            global.io.to(receiverSocketId).emit("Receive_friend_request", {
                senderId: user,
                requestId: request._id
            })
        }

        return res.status(200).json({
            sucess: true,
            message: "Friend request sent"
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Error in inviteAFriend Route"
        })
    }
}



exports.acceptFriendRequest = async (req, res) => {
    try {
        //const { requestId } = req.params;
        const user = req.user.userId;

        const { email, token, requestId } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(user).select("email");


        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        };

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        };

        if (!requestId) {
            return res.status(200).json({
                success: false,
                message: "Please provide requestId"
            });
        }

        const request = await FriendRequest.findOne({ sender: requestId });

        if (!request) {
            return res.status(200).json({
                success: false,
                message: "Friend request not found"
            });
        }

        request.status = "accepted";
        await request.save();

        await User.findByIdAndUpdate(user, {
            $addToSet: { userAllFriends: request.sender }
        });

        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { userAllFriends: user }
        });


        const senderSocketId = global.onlineUsers.get(request.sender.toString());

        if (senderSocketId) {
            global.io.to(senderSocketId).emit("friend_request_accepted", {
                friendId: user,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Friend request accepted"
        });

    } catch (error) {
        console.error("Error in acceptFriendRequest:", error);
        return res.status(500).json({
            success: false,
            message: "Error in acceptRequest controller"
        });
    }
}





exports.createPost = async (req, res) => {
    try {
        const { description, visibility, hashTag, appliedFilter, filteredImageUrl, is_photography, token, email, colorMatrix } = req.body;
        const userId = req.user.userId;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }


        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        // Validate required fields
        if (!description || typeof visibility === 'undefined') {
            return res.status(200).json({
                success: false,
                message: "Description and visibility are required.",
            });
        }

        // Normalize boolean values
        const visibilityBoolean = (visibility === 'true' || visibility === true);
        const isImageContent = (is_photography === 'true' || is_photography === true);

        // Upload images if applicable
        let imageUrls = [];
        if (req.files?.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: "profile_pics",
                });
                imageUrls.push(result.secure_url);
            }
        }

        // Build content object
        const content = {
            image: imageUrls.length > 0,
            description: true,
            descriptionText: description,
            imageUrl: imageUrls,
        };

        let parsedColorMatrix = [];

        if (isImageContent && colorMatrix) {
            let matrixArray = [];

            if (typeof colorMatrix === 'string') {
                try {
                    matrixArray = JSON.parse(colorMatrix);
                } catch (error) {
                    console.warn("Invalid colorMatrix JSON string", error);
                }
            } else if (Array.isArray(colorMatrix)) {
                matrixArray = colorMatrix;
            }

            if (Array.isArray(matrixArray)) {
                parsedColorMatrix = matrixArray.map(val =>
                    mongoose.Types.Decimal128.fromString(parseFloat(val).toString())
                );
            }
        }

        console.log("Raw colorMatrix from req.body:", colorMatrix);
        console.log("Parsed colorMatrix:", parsedColorMatrix);

        // Create post document
        const newPost = await Postcreate.create({
            userId,
            content,
            visibility: visibilityBoolean,
            hashTag: Array.isArray(hashTag) ? hashTag : hashTag ? [hashTag] : [],
            colorMatrix: parsedColorMatrix, // ✅ This is your Decimal128 array
            appliedFilter: isImageContent ? appliedFilter : 'normal',
            filteredImageUrl: isImageContent ? filteredImageUrl : " ",
            is_photography: isImageContent,
        });



        await User.findByIdAndUpdate(userId, {
            $push: { posts: newPost._id }
        });

        return res.status(200).json({
            success: true,
            message: "Post created successfully",
            post: {
                _id: newPost._id,
                createdAt: newPost.createdAt,
                visibility: newPost.visibility,
                content: newPost.content,
                hashTag: newPost.hashTag,
                imageUrls,
            },
            newPost,
        });

    } catch (error) {
        console.error("Error in createPost:", error);
        return res.status(500).json({
            success: false,
            message: "Server error occurred while creating the post",
        });
    }
};






exports.getAllFriends = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).populate('userAllFriends', '_id fullName userName profilePic');

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            friends: user.userAllFriends,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};





exports.sharePostWithFriend = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { momentId, friendId } = req.params;

        // Step 1: Validate the post
        const originalPost = await Postcreate.findOne({ _id: postId });
        if (!originalPost) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        }

        // Step 2: Verify friendship
        const user = await User.findById(userId);
        const isFriend = user.userAllFriends.includes(friendId);
        if (!isFriend) {
            return res.status(200).json({
                success: false,
                message: "Not a friend, so post Not share"
            });
        }

        // Step 3: Clone the post
        const sharedPost = new Postcreate({
            userId: friendId, // Save under the friend's profile
            content: originalPost.content,
            visibility: true, // Shared posts are visible
            hashTag: originalPost.hashTag,
            imageFilter: originalPost.imageFilter,
            contentType: originalPost.contentType,
        });

        await sharedPost.save();

        // Step 4: Update post's share data
        originalPost.shares.push(friendId);
        originalPost.shareCount += 1;
        await originalPost.save();

        // Step 5: Optionally, log in friend's user profile that they received a shared post
        await User.findByIdAndUpdate(friendId, {
            $push: {
                receivedShares: {
                    from: userId,
                    post: sharedPost._id,
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Post shared successfully  your friend",
            sharedPostId: sharedPost._id,
            originalPost,
        });
    } catch (err) {
        console.error("Error sharing post:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




// exports.getAllPosts = async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const posts = await Postcreate.find({ userId }).populate("userId", "fullName userName profilePic").sort({ createdAt: -1 });

//         if (!userId) {
//             return res.status(200).json({
//                 success: false,
//                 message: "User Not found",
//             })
//         }

//         if (!posts) {
//             return res.status(200).json({
//                 success: false,
//                 message: "No posts found",
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             posts,
//         });
//     } catch (error) {
//         console.error("Error in getAllPosts:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };








exports.report = async (req, res) => {
    try {
        const currentUserId = req.user.userId; // The user who is giving the TedBlack coin
        const { postId } = req.params;


        const post = await Postcreate.findOne({ _id: postId });

        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found",
            });
        }

        const giver = await User.findById(currentUserId);
        const receiver = await User.findById(post.userId);

        if (!giver || !receiver) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        if (
            giver.coinWallet.tedGold < 1 ||
            giver.coinWallet.tedSilver < 2 ||
            giver.coinWallet.tedBronze < 3
        ) {
            return res.status(200).json({
                success: false,
                message: "Insufficient coins to give TedBlack coin",
            });
        }

        giver.coinWallet.tedGold -= 1;
        giver.coinWallet.tedSilver -= 1;
        giver.coinWallet.tedBronze -= 1;

        giver.coinWallet.tedBlack += 1;

        const calculateTotalTedCoin = (wallet) => {
            return Math.floor(
                wallet.tedGold / 75 +
                wallet.tedSilver / 50 +
                wallet.tedBronze / 25
            );
        };

        giver.coinWallet.totalTedCoin = calculateTotalTedCoin(giver.coinWallet);
        receiver.coinWallet.totalTedCoin = calculateTotalTedCoin(receiver.coinWallet);

        await giver.save();
        await receiver.save();

        return res.status(200).json({
            success: true,
            message: "reporte the post",
            giverWallet: giver.coinWallet,
        });

    } catch (error) {
        console.log("error");
        return res.status(500).json({
            success: false,
            message: "Server error while processing report",
        })
    }
}





exports.createMoment = async (req, res) => {
    try {
        const { descripition, is_closeFriends, token, email } = req.body;
        const userId = req.user.userId;
        const image = req.files;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }


        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!image || !descripition) {
            return res.status(200).json({
                success: false,
                message: "Image and description are required",
            });
        }

        let imageUrls = [];
        if (image && image.length > 0) {
            for (let file of image) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: "profile_pics",
                });
                imageUrls.push(result.secure_url);
            }
        }

        const newMoment = await Moment.create({
            userId,
            image: imageUrls,
            descripition,
            is_closeFriends: is_closeFriends || false,
        });

        return res.status(200).json({
            success: true,
            message: "Moment created successfully and will expire in 24 hours",
            moment: newMoment,
        });
    } catch (error) {
        console.error("Error in createMoment:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while creating moment",
        });
    }
};





// ?? !!
exports.viewYourPosts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;

        if (!postId) {
            return res.status(200).json({
                sucess: false,
                message: "please provide postId"
            })
        }


        const viewApost = await Postcreate.findOne({ _id: postId })

        return res.status(200).json({
            sucess: true,
            viewApost,
            message: "single post fetched SucessFully"
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Error in viewPost controller"
        })
    }
};




exports.viweAllPosts = async (req, res) => {
    try {
        const userId = req.user.userId;

        const viewAllpost = await Postcreate.find();

        return res.status(200).json({
            sucess: true,
            viewAllpost,
            message: "Allpost Fetched SucessFully"
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Error in viewAllPosts controller"
        })
    }
}



exports.getYourMoment = async (req, res) => {
    try {

        const { email, token } = req.body;
        const userId = req.user.userId;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }



        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const yourMoment = await Moment.find({ userId }).populate("userId", "userName profilePic")

        return res.status(200).json({
            sucess: false,
            message: "Fetched your moments",
            yourMoment,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "error getting in viewYourMoment "
        })
    }
}


// Add Last 
exports.viewAMoment = async (req, res) => {
    try {
        const viewerId = req.user.userId;
        //const { userId, momentId } = req.params;
        const { email, token, userId, momentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }
        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(viewerId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }



        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }


        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "Moment owner ID is required",
            });
        }

        // 👉 View single moment
        if (momentId) {
            const moment = await Moment.findOne({ _id: momentId, userId });

            if (!moment) {
                return res.status(200).json({
                    success: false,
                    message: "Moment not found for the given user",
                });
            }

            // ➕ Push viewerId only if not already present and not the owner
            if (viewerId !== userId && !moment.viewers.includes(viewerId)) {
                moment.viewers.push(viewerId);
                await moment.save();
            }

            // 🧾 Populate for response only
            const populatedMoment = await Moment.findById(momentId)

            //const populatedMoment = await Moment.findById(momentId).populate("viewers", "userName email profilePic");

            return res.status(200).json({
                success: true,
                message: "Fetched single moment",
                viewersCount: populatedMoment.viewers.length,
                viewers: populatedMoment.viewers,
                moment: populatedMoment,
            });
        }

        // // 👉 View all moments for the user
        // const moments = await Moment.find({ userId });

        // if (!moments.length) {
        //     return res.status(404).json({
        //         success: false,
        //         message: "No moments found for this user",
        //     });
        // }

        // // ➕ Add viewerId to each moment if needed (only if not the owner)
        // if (viewerId !== userId) {
        //     for (let moment of moments) {
        //         if (!moment.viewers.includes(viewerId)) {
        //             moment.viewers.push(viewerId);
        //             await moment.save();
        //         }
        //     }
        // }

        // const updatedMoments = await Moment.find({ userId }).populate("viewers", "userName email profilePic");

        // return res.status(200).json({
        //     success: true,
        //     message: "Fetched all user's moments",
        //     viewersCount: updatedMoments.reduce((acc, m) => acc + m.viewers.length, 0),
        //     moments: updatedMoments,
        // });

    } catch (error) {
        console.error("Error in viewAMoment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error in viewAMoment",
        });
    }
};



// if any changes happen in momentViewControl logic then also change here
exports.getAllMoments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];

        const user = await User.findById(userId).select("email userAllFriends");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (user.email !== email) {
            return res.status(401).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const friendIds = user.userAllFriends;

        // If you also want to include current user's own moments, add: friendIds.push(userId);
        // friendIds.push(userId);

        const allMoments = await Moment.find({ userId: { $in: friendIds } })
            .populate("userId", "userName profilePic");

        return res.status(200).json({
            success: true,
            message: "Fetched all friends' moments",
            allMoments
        });

    } catch (error) {
        console.error("Error in getAllMoments:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in getAllMoments"
        });
    }
};


// work is pending Here
exports.momentViewControl = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, momentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!momentId) {
            return res.status(200).json({
                success: false,
                message: "Moment ID is required",
            });
        }

        const moment = await Moment.findById(momentId);
        if (!moment) {
            return res.status(200).json({
                success: false,
                message: "Moment not found",
            });
        }

        moment.is_closeFriends = !moment.is_closeFriends; // Toggle the is_closeFriends status




    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Server Error while Control MomentView"
        })
    }
}



// This for authorized user moment viewers count
exports.authorizedUserMomentsViewersCount = async (req, res) => {
    try {
        const userId = req.user.userId; // Authorized user
        // const { momentId } = req.params;

        const { email, token, momentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }



        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        // If specific momentId is provided
        if (momentId) {
            const moment = await Moment.findOne({ _id: momentId, userId }).select("viewers");

            if (!moment) {
                return res.status(404).json({
                    success: false,
                    message: "Moment not found or not owned by the authorized user",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Fetched viewer count for the specific moment",
                totalViewers: moment.viewers.length,
                momentId: momentId
            });
        }

        // If no momentId, fetch all moments of the user
        const moments = await Moment.find({ userId }).select("viewers");

        if (!moments || moments.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No moments found for this user",
                totalViewers: 0,
                momentsCount: 0
            });
        }

        // Calculate unique viewer IDs across all moments
        const allViewerIds = moments.flatMap(moment => moment.viewers);
        const uniqueViewerIds = [...new Set(allViewerIds.map(String))];

        return res.status(200).json({
            success: true,
            message: "Fetched authorized user's total viewers across all moments",
            totalViewers: uniqueViewerIds.length,
            momentsCount: moments.length
        });

    } catch (error) {
        console.error("Error in authorizedUserMomentsViewersCount:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in authorizedUserMomentsViewersCount",
        });
    }
};




//This  for authorized user moment viewers list on the basis of userName and profilePic
exports.authorizedUserMomentsViewers = async (req, res) => {
    try {
        const userId = req.user.userId; // Authorized user
        //const { momentId } = req.params;


        const { email, token, momentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }



        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        // If specific momentId is provided
        if (momentId) {
            const moment = await Moment.findOne({ _id: momentId, userId })
                .populate("viewers", "userName profilePic")
                .select("viewers");

            if (!moment) {
                return res.status(404).json({
                    success: false,
                    message: "Moment not found or not owned by the authorized user",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Fetched viewers for the specific moment",
                viewers: moment.viewers,
                momentId: momentId
            });
        }

        // Fetch all moments for the user and populate viewers
        const moments = await Moment.find({ userId })
            .populate("viewers", "userName profilePic")
            .select("viewers");

        if (!moments || moments.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No moments found for this user",
                viewers: [],
                momentsCount: 0
            });
        }

        // Merge all viewers and ensure uniqueness by _id
        const viewerMap = new Map();
        for (const moment of moments) {
            for (const viewer of moment.viewers) {
                viewerMap.set(viewer._id.toString(), viewer); // Avoid duplicates
            }
        }

        const uniqueViewers = Array.from(viewerMap.values());

        return res.status(200).json({
            success: true,
            message: "Fetched authorized user's unique viewers across all moments",
            viewers: uniqueViewers,
            momentsCount: moments.length
        });

    } catch (error) {
        console.error("Error in authorizedUserMomentsViewers:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in authorizedUserMomentsViewers",
        });
    }
};





exports.deleteMoment = async (req, res) => {
    try {
        const userId = req.user.userId;
        //const { momentId } = req.params;

        const { email, token, momentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }



        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!momentId) {
            return res.status(200).json({
                success: false,
                message: "Moment ID is required",
            });
        }

        const moment = await Moment.findOne({ _id: momentId, userId });

        if (!moment) {
            return res.status(200).json({
                success: false,
                message: "Moment not found or not owned by the authorized user",
            });
        }

        await moment.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Moment deleted successfully",
        });

    } catch (error) {
        console.error("Error in deleteMoment:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in deleteMoment",
        });
    }
}




exports.giveCommentToAnMomemt = async (req, res) => {
    try {
        const userId = req.user.userId;
        //const { momentId } = req.params;
        const { comment, token, email, momentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }


        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!momentId) {
            return res.status(200).json({
                success: false,
                message: "Moment ID is required",
            });
        }

        if (!comment) {
            return res.status(200).json({
                success: false,
                message: "Comment is required",
            });
        }

        const moment = await Moment.findOne({ _id: momentId });

        if (!moment) {
            return res.status(200).json({
                success: false,
                message: "Moment not found",
            });
        }

        moment.comments.push({ userId, comment });
        await moment.save();

        return res.status(200).json({
            success: true,
            message: "Comment added successfully",
            comments: moment.comments
        });

    } catch (error) {
        console.error("Error in giveCommentToAMomemt:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in giveCommentToAMomemt",
        });
    }
}




exports.replyToMomontComment = async (req, res) => {
    try {
        const userId = req.user.userId;
        //const { momentId, commentId } = req.params;
        const { reply, email, token, momentId, commentId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!reply || !momentId || !commentId) {
            return res.status(200).json({
                success: false,
                message: "Moment ID, Comment ID, and Reply are required.",
            });
        }

        const moment = await Moment.findById(momentId);
        if (!moment) {
            return res.status(200).json({
                success: false,
                message: "Moment not found.",
            });
        }

        const comment = moment.comments.id(commentId);
        if (!comment) {
            return res.status(200).json({
                success: false,
                message: "Comment not found.",
            });
        }

        comment.replies.push({
            userId,
            reply,
        });

        await moment.save();

        return res.status(200).json({
            success: true,
            message: "Reply added successfully.",
            updatedComment: comment,
        });

    } catch (error) {
        console.error("Error in replyToComment:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while replying to comment.",
        });
    }
};






exports.getAllCommentsWithReplies = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, momentId } = req.body;
        //const { momentId } = req.params;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");


        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });

        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!momentId) {
            return res.status(400).json({
                success: false,
                message: "Moment ID is required",
            });
        }

        const moment = await Moment.findById(momentId)
            .populate("comments.userId", "userName profilePic")
            .populate("comments.replies.userId", "userName profilePic");

        if (!moment) {
            return res.status(404).json({
                success: false,
                message: "Moment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Fetched all comments and replies for the moment",
            comments: moment.comments,
        });

    } catch (error) {
        console.error("Error in getAllCommentsWithReplies:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching comments and replies",
        });
    }
};




exports.getAllPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email userAllFriends");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const friendIds = userEmail.userAllFriends;

        const posts = await Postcreate.find({
            $or: [
                { userId: { $in: [...friendIds, userId] } },   // Posts by user or friends
                { visibility: true }                           // OR public posts
            ]
        })
            .populate("userId", "userName profilePic email")
            .populate("comments.userId", "userName profilePic email");

        // .populate("comments.replies.userId", "userName profilePic email");

        if (!posts || posts.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No posts found",
            });
        }


        const formattedPosts = posts.map(post => {
            const tedGoldCount = post.tedGoldGivers?.length || 0;
            const tedSilverCount = post.tedSilverGivers?.length || 0;
            const tedBronzeCount = post.tedBronzeGivers?.length || 0;
            const tedBlackCoinCount = post.tedBlackCoinData?.length || 0;
            const totalCoin = (tedGoldCount * 75) + (tedSilverCount * 50) + (tedBronzeCount * 25);

            return {
                ...post._doc,
                tedGoldCount,
                tedSilverCount,
                tedBronzeCount,
                tedBlackCoinCount,
                totalCoin
            };
        });

        return res.status(200).json({
            success: true,
            message: "Fetched all posts",
            posts: formattedPosts
        });
    }
    catch (error) {
        console.error("Error in getAllPost:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching all posts",
        });
    }
}


exports.getSinglePost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, postId } = req.body;
        // const { postId } = req.params;
        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!postId) {
            return res.status(200).json({
                success: false,
                message: "Post ID is required",
            });
        }

        const post = await Postcreate.findById(postId)
            .populate("userId", "userName profilePic email")
            .populate("comments.userId", "userName profilePic email")
        // .populate("comments.replies.userId", "userName profilePic email");

        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found",
            });
        }
        // Coin counts
        const tedGoldCount = post.tedGoldGivers?.length || 0;
        const tedSilverCount = post.tedSilverGivers?.length || 0;
        const tedBronzeCount = post.tedBronzeGivers?.length || 0;
        const tedBlackCoinCount = post.tedBlackCoinData?.length || 0;
        const totalCoin = (75 * tedGoldCount) + (50 * tedSilverCount) + (25 * tedBronzeCount);

        return res.status(200).json({
            success: true,
            message: "Fetched single post",
            post: {
                ...post._doc, // original post fields
                tedGoldCount,
                tedSilverCount,
                tedBronzeCount,
                tedBlackCoinCount,
                totalCoin
            }
        });
    } catch (error) {
        console.error("Error in getSinglePost:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching single post",
        });
    }
};




exports.giveCommentToPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        //const { postId } = req.params;
        const { comment, email, token, postId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");


        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            })
        }

        if (!postId) {
            return res.status(200).json({
                success: false,
                message: "Post ID is required",
            });
        }

        if (!comment) {
            return res.status(200).json({
                success: false,
                message: "Comment is required",
            });
        }

        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found",

            });
        }

        post.comments.push({ userId, comment });
        await post.save();
        return res.status(200).json({
            success: true,
            message: "Comment added successfully",
            comments: post.comments
        });

    } catch (error) {
        console.error("Error in giveCommentToPost:", error);
        return res.status(500).json({
            sucess: false,
            message: "server error while adding comment to post"
        })
    }
}



// Route will be Not added in userAuthRoutes (work is pending Here)
exports.giveReplayToCommentPost = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { email, token, commentId, postId, reply } = req.body;
        if (!email || !token || !commentId || !postId || !reply) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide All Details"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }


        const posts = await Postcreate.findById(postId);

        if (!posts) {
            return res.status(200).json({
                sucess: false,
                message: "Post Not Found."
            })
        }

        const comment = posts.comments.id(commentId);
        if (!comment) {
            return res.status(200).json({
                sucess: false,
                message: "Comment Not Found."
            })
        }

        comment.replies.push({
            userId,
            reply
        })

        await posts.save();

        return res.status(200).json({
            sucess: true,
            message: "Reply Give SucessFully to an Post"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Server Error while Give ReplayTo an Posts"
        })
    }
}




exports.getAuthorizedUserPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const userPosts = await Postcreate.find({ userId })
            .populate("userId", "userName profilePic email")
            .populate("comments.userId", "userName profilePic email")
        // .populate("comments.replies.userId", "userName profilePic email");

        if (!userPosts || userPosts.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No posts found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Fetched all posts for the authorized user",
            userPosts,
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            sucess: false,
            message: "server error while fetching userAll Posts"
        })
    }
}





exports.getAuthorizedUserPhotoGraphy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }
        const authHeader = req.headers.authorization;

        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const userPhotoGraphy = await Postcreate.find({ userId, is_photography: true })
            .populate("userId", "userName profilePic email")
            .populate("comments.userId", "userName profilePic email")
        // .populate("comments.replies.userId", "userName profilePic email");


        if (!userPhotoGraphy || userPhotoGraphy.length === 0) {
            return res.status(200).json({
                sucess: false,
                message: "No Photos found for this user"
            })
        }


        return res.status(200).json({
            sucess: true,
            message: "Fetched all Photos for the authorized user",
            userPhotoGraphy,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Server Error while fetching userAll Photos"
        })
    }
}





exports.giveTedGoldToPost = async (req, res) => {
    try {
        const giverId = req.user.userId;
        //const { postId } = req.params;
        const { email, token, postId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(giverId).select("email");


        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }
        if (!postId) {
            return res.status(200).json({
                success: false,
                message: "Post ID is required",
            });
        }

        //  Find the giver
        const giver = await User.findById(giverId);
        if (!giver) {
            return res.status(200).json({
                success: false,
                message: "Giver not found"
            });
        }

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        }

        if (
            (post.tedGoldGivers?.includes(giverId))
        ) {
            return res.status(200).json({
                success: false,
                message: "You have already given a coin to this post"
            });
        }




        const receiver = await User.findById(post.userId);
        if (!receiver) return res.status(200).json({ success: false, message: "Post owner not found" });

        // If already Gold, quit
        if (post.tedGoldGivers?.includes(giverId))
            return res.status(200).json({ success: false, message: "Already gave Gold" });

        const giverIdStr = giverId.toString();

        // ---------- remove from lower tiers if present ----------
        const tiers = [
            { arr: "tedSilverGivers", cnt: "tedSilverCount", wallet: "tedSilver" },
            { arr: "tedBronzeGivers", cnt: "tedBronzeCount", wallet: "tedBronze" },
            { arr: "tedBlackGivers", cnt: "tedBlackCount", wallet: "tedBlack" }
        ];

        tiers.forEach(t => {
            if (post[t.arr]?.includes(giverId)) {
                post[t.arr] = post[t.arr].filter(id => id.toString() !== giverIdStr);
                post[t.cnt] = Math.max((post[t.cnt] || 1) - 1, 0);
                receiver.coinWallet[t.wallet] =
                    Math.max((receiver.coinWallet[t.wallet] || 1) - 1, 0);
            }
        });

        // ---------- add to Gold ----------
        post.tedGoldGivers = post.tedGoldGivers || [];
        post.tedGoldGivers.push(giverId);
        post.tedGoldCount = (post.tedGoldCount || 0) + 1;
        receiver.coinWallet.tedGold = (receiver.coinWallet.tedGold || 0) + 1;

        // ---------- recalc totalTedCoin ----------
        const { tedGold = 0, tedSilver = 0, tedBronze = 0 } = receiver.coinWallet;
        const goldUnits = Math.floor(tedGold / 75);
        const silverUnits = Math.floor(tedSilver / 50);
        const bronzeUnits = Math.floor(tedBronze / 25);
        receiver.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

        await receiver.save();
        await post.save();

        res.status(200).json({
            success: true,
            message: "Switched to TedGold successfully",
            counts: {
                tedGold: post.tedGoldCount,
                tedSilver: post.tedSilverCount,
                tedBronze: post.tedBronzeCount,
                tedBlack: post.tedBlackCount
            }
        });
    } catch (error) {
        console.error("Error giving TedGold:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in giveTedGoldToPost"
        });
    }
};



exports.giveTedSilverPost = async (req, res) => {
    try {
        const giverId = req.user.userId;
        // const { postId } = req.params;
        const { email, token, postId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(giverId).select("email");


        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!postId) {
            return res.status(200).json({
                success: false,
                message: "Post ID is required",
            });
        }

        //  Find the giver
        const giver = await User.findById(giverId);
        if (!giver) {
            return res.status(200).json({
                success: false,
                message: "Giver not found"
            });
        }

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        };


        if (

            (post.tedSilverGivers?.includes(giverId))

        ) {
            return res.status(200).json({
                success: false,
                message: "You have already given a Silvercoin to this post"
            });
        }

        const receiver = await User.findById(post.userId);
        if (!receiver) return res.status(200).json({ success: false, message: "Post owner not found" });

        const giverStr = giverId.toString();

        /* ---------- remove from Gold / Bronze tiers if present ---------- */
        const tiers = [
            { arr: "tedGoldGivers", cnt: "tedGoldCount", wallet: "tedGold" },
            { arr: "tedBronzeGivers", cnt: "tedBronzeCount", wallet: "tedBronze" },
            { arr: "tedBlackGivers", cnt: "tedBlackCount", wallet: "tedBlack" }
        ];

        tiers.forEach(t => {
            if (post[t.arr]?.includes(giverId)) {
                post[t.arr] = post[t.arr].filter(id => id.toString() !== giverStr);
                post[t.cnt] = Math.max((post[t.cnt] || 1) - 1, 0);
                receiver.coinWallet[t.wallet] =
                    Math.max((receiver.coinWallet[t.wallet] || 1) - 1, 0);
            }
        });

        /* ---------- add to Silver tier ---------- */
        post.tedSilverGivers = post.tedSilverGivers || [];
        post.tedSilverGivers.push(giverId);
        post.tedSilverCount = (post.tedSilverCount || 0) + 1;
        receiver.coinWallet.tedSilver = (receiver.coinWallet.tedSilver || 0) + 1;

        /* ---------- recalc totalTedCoin ---------- */
        const { tedGold = 0, tedSilver = 0, tedBronze = 0 } = receiver.coinWallet;
        const goldUnits = Math.floor(tedGold / 75);
        const silverUnits = Math.floor(tedSilver / 50);
        const bronzeUnits = Math.floor(tedBronze / 25);
        receiver.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

        await receiver.save();
        await post.save();

        return res.status(200).json({
            success: true,
            message: "TedSilver given successfully",
            counts: {
                tedGold: post.tedGoldCount,
                tedSilver: post.tedSilverCount,
                tedBronze: post.tedBronzeCount,
                tedBlack: post.tedBlackCount
            },
            toUser: receiver._id
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "error in giveTedSilverPost controller"
        })
    }
}



exports.giveTedBronzePost = async (req, res) => {
    try {
        const giverId = req.user.userId;
        //const { postId } = req.params;
        const { email, token, postId } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(giverId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!postId) {
            return res.status(200).json({
                success: false,
                message: "Post ID is required",
            });
        }

        //  Find the giver
        const giver = await User.findById(giverId);
        if (!giver) {
            return res.status(200).json({
                success: false,
                message: "Giver not found"
            });
        }

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        };

        if (
            (post.tedBronzeGivers?.includes(giverId))
        ) {
            return res.status(200).json({
                success: false,
                message: "You have already given a Bronzecoin to this post"
            });
        }

        const receiver = await User.findById(post.userId);
        if (!receiver) return res.status(200).json({ success: false, message: "Post owner not found" });

        const giverStr = giverId.toString();

        /* ---------- remove from Gold / Silver if present ---------- */
        const tiers = [
            { arr: "tedGoldGivers", cnt: "tedGoldCount", wallet: "tedGold" },
            { arr: "tedSilverGivers", cnt: "tedSilverCount", wallet: "tedSilver" },
            { arr: "tedBlackGivers", cnt: "tedBlackCount", wallet: "tedBlack" }
        ];

        tiers.forEach(t => {
            if (post[t.arr]?.includes(giverId)) {
                post[t.arr] = post[t.arr].filter(id => id.toString() !== giverStr);
                post[t.cnt] = Math.max((post[t.cnt] || 1) - 1, 0);
                receiver.coinWallet[t.wallet] =
                    Math.max((receiver.coinWallet[t.wallet] || 1) - 1, 0);
            }
        });

        /* ---------- add to Bronze tier ---------- */
        post.tedBronzeGivers = post.tedBronzeGivers || [];
        post.tedBronzeGivers.push(giverId);
        post.tedBronzeCount = (post.tedBronzeCount || 0) + 1;
        receiver.coinWallet.tedBronze = (receiver.coinWallet.tedBronze || 0) + 1;

        /* ---------- recalc totalTedCoin ---------- */
        const { tedGold = 0, tedSilver = 0, tedBronze = 0 } = receiver.coinWallet;
        const goldUnits = Math.floor(tedGold / 75);
        const silverUnits = Math.floor(tedSilver / 50);
        const bronzeUnits = Math.floor(tedBronze / 25);
        receiver.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

        await receiver.save();
        await post.save();

        return res.status(200).json({
            success: true,
            message: "TedBronze given successfully",
            counts: {
                tedGold: post.tedGoldCount,
                tedSilver: post.tedSilverCount,
                tedBronze: post.tedBronzeCount,
                tedBlack: post.tedBlackCount
            },
            toUser: receiver._id
        });

    } catch (error) {
        console.error("Error in giveTedBronzePost:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in giveTedBronzePost"
        });
    }
};



// Most Important Thing For this Application
exports.giveTedBlackCoin = async (req, res) => {
    try {
        const authorizedUserId = req.user.userId;
        const { postId, reason, email, token, hashTags } = req.body;

        if (!postId || !reason || !email || !token) {
            return res.status(400).json({
                success: false,
                message: "Missing postId, reason, email, or token",
            });
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(authorizedUserId).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token ",
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid  email",
            });
        }

        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(200).json({ success: false, message: "Post not found" });
        }

        if (post.tedBlackGivers?.includes(authorizedUserId)) {
            return res.status(200).json({
                success: false,
                message: "You have already given a TedBlackCoin to this post",
            });
        }

        const receiver = await User.findById(post.userId);
        if (!receiver) {
            return res.status(200).json({ success: false, message: "Post owner not found" });
        }


        const allowedTags = ["spam", "abuse", "misinformation"];

        if (!allowedTags.includes(hashTags)) {
            return res.status(200).json({
                success: false,
                message: "Invalid hashTags. Allowed values are: spam, abuse, misinformation",
            });
        }

        post.tedBlackCoinData = {
            givenBy: authorizedUserId,
            reason,
            createdAt: new Date(),
            voters: [],
            agree: [],
            disagree: [],
            isFinalized: false,
            hashTags
        };
        await post.save();

        const allGivers = [
            ...post.tedGoldGivers,
            ...post.tedSilverGivers,
            ...post.tedBronzeGivers
        ];

        const uniqueGivers = [...new Set(allGivers.map(g => g.toString()))];

        console.log("Unique Givers Print");

        // 🆕 Save tracking record in TedBlackers
        // postUserId
        // userPostId
        await TedBlackers.create({
            userId: authorizedUserId, // Post creator (the one being accused)
            postUserId: post.userId,
            userPostId: postId,
            status: "OnGoing",
            notiFied: uniqueGivers.length,
            agree: 0,
            disAgree: 0,
            reasone: reason,
            hashTags: hashTags
        });

        // 🔔 Notify all unique givers (excluding the blackCoin giver)
        for (const giverId of uniqueGivers) {
            if (giverId !== authorizedUserId) {
                const giver = await User.findById(giverId);
                if (!giver) continue;

                await Notification.create({
                    userId: giverId,
                    postId: post._id,
                    type: "TedBlackCoinVote",
                    message: `A TedBlackCoin has been given to a post you reacted to. Reason: ${reason}`,
                    actions: ["Agree", "Disagree"]
                });
                console.log("Notification created for giver")

                const blackCoinGiver = await User.findById(authorizedUserId).select("userName profilePic");

                if (giver.fcmToken) {
                    console.log("Sending FCM Notification to giver");
                    console.log("Notify user List")

                    await admin.messaging().send({
                        token: giver.fcmToken,
                        notification: {
                            title: "Vote on TedBlackCoin",
                            body: `A TedBlackCoin was given to a post you liked by ${blackCoinGiver.userName}. Reason: ${reason}`
                        },
                        data: {
                            postId: post._id.toString(),
                            reason,
                            actionType: "TedBlackCoinVote",
                            giverId: authorizedUserId.toString(),
                            giverName: blackCoinGiver.userName,
                            giverProfilePic: blackCoinGiver.profilePic || "",
                            createdAt: post.tedBlackCoinData?.createdAt?.toString() || new Date().toISOString(),
                            // Button data for Flutter to handle
                            hasButtons: "true",
                            buttonType: "agree_disagree",
                            buttons: JSON.stringify([
                                {
                                    id: "agree",
                                    text: "✅ Agree",
                                    action: "agree_vote",
                                    color: "#4CAF50"
                                },
                                {
                                    id: "disagree",
                                    text: "❌ Disagree",
                                    action: "disagree_vote",
                                    color: "#F44336"
                                }
                            ]),
                            // Add click action for Android
                            click_action: "FLUTTER_NOTIFICATION_CLICK"
                        },
                        // Android specific configuration
                        android: {
                            notification: {
                                title: "Vote on TedBlackCoin",
                                body: `A TedBlackCoin was given to a post you liked by ${blackCoinGiver.userName}. Reason: ${reason}`,
                                channelId: "tedblackcoin_votes",
                                priority: "high",
                                defaultSound: true,
                                defaultVibrateTimings: true,
                                clickAction: "FLUTTER_NOTIFICATION_CLICK"
                            },
                            data: {
                                postId: post._id.toString(),
                                reason,
                                actionType: "TedBlackCoinVote",
                                giverId: authorizedUserId.toString(),
                                giverName: blackCoinGiver.userName,
                                giverProfilePic: blackCoinGiver.profilePic || "",
                                hasButtons: "true",
                                buttonType: "agree_disagree"
                            }
                        },
                        // iOS specific configuration
                        // apns: {
                        //     payload: {
                        //         aps: {
                        //             alert: {
                        //                 title: "Vote on TedBlackCoin",
                        //                 body: `A TedBlackCoin was given to a post you liked by ${blackCoinGiver.userName}. Reason: ${reason}`
                        //             },
                        //             sound: "default",
                        //             badge: 1
                        //         }
                        //     },
                        //     // Custom data for iOS
                        //     customData: {
                        //         postId: post._id.toString(),
                        //         reason,
                        //         actionType: "TedBlackCoinVote",
                        //         giverId: authorizedUserId.toString(),
                        //         giverName: blackCoinGiver.userName,
                        //         giverProfilePic: blackCoinGiver.profilePic || "",
                        //         hasButtons: "true",
                        //         buttonType: "agree_disagree"
                        //     }
                        // }
                    });

                    console.log("Sending completed FCM Notification to giver with button data");
                }
            }
        }

        // Schedule evaluation in 20 minutes
        const blackCoinGiverId = authorizedUserId;

        console.log("Outside setTimeOut giveTedBlackCoin")
        setTimeout(async () => {
            const updatedPost = await Postcreate.findById(postId);

            if (updatedPost && !updatedPost.tedBlackCoinData.isFinalized) {
                const { agree, disagree } = updatedPost.tedBlackCoinData;
                const totalVotes = agree.length + disagree.length;
                const agreePercentage = totalVotes > 0 ? (agree.length / totalVotes) * 100 : 0;
                console.log("Inside setTimeOut giveTedBlackCoin")


                // 🎯 Update TedBlackers record
                const tedBlackRecord = await TedBlackers.findOne({
                    userId: updatedPost.userId,
                    reasone: updatedPost.tedBlackCoinData.reason,
                    // createdAt: updatedPost.tedBlackCoinData.createdAt
                });



                tedBlackRecord.agree = agree.length || 0;
                tedBlackRecord.disAgree = disagree.length || 0;


                if (agreePercentage >= 70) {
                    const postCreator = await User.findById(updatedPost.userId);
                    console.log("Initial state black coin giveTedBlackCoin")
                    const updatedTiers = [
                        { arr: "tedGoldGivers", cnt: "tedGoldCount", wallet: "tedGold" },
                        { arr: "tedSilverGivers", cnt: "tedSilverCount", wallet: "tedSilver" },
                        { arr: "tedBronzeGivers", cnt: "tedBronzeCount", wallet: "tedBronze" },
                    ];

                    for (const tier of updatedTiers) {
                        if (updatedPost[tier.arr]?.includes(blackCoinGiverId)) {
                            updatedPost[tier.arr] = updatedPost[tier.arr].filter(id => id.toString() !== blackCoinGiverId.toString());
                            updatedPost[tier.cnt] = Math.max((updatedPost[tier.cnt] || 1) - 1, 0);
                            postCreator.coinWallet[tier.wallet] = Math.max((postCreator.coinWallet[tier.wallet] || 1) - 1, 0);
                        }
                    }

                    tedBlackRecord.status = "Accept TedBlack";

                    updatedPost.tedBlackGivers = updatedPost.tedBlackGivers || [];
                    if (!updatedPost.tedBlackGivers.includes(blackCoinGiverId)) {
                        updatedPost.tedBlackGivers.push(blackCoinGiverId);
                    }
                    updatedPost.tedBlackCount = (updatedPost.tedBlackCount || 0) + 1;

                    postCreator.coinWallet.tedBlack = (postCreator.coinWallet.tedBlack || 0) + 1;
                    postCreator.coinWallet.tedGold = (postCreator.coinWallet.tedGold || 0) - 1;
                    postCreator.coinWallet.tedSilver = (postCreator.coinWallet.tedSilver || 0) - 2;
                    postCreator.coinWallet.tedBronze = (postCreator.coinWallet.tedBronze || 0) - 3;

                    await postCreator.save();
                    await updatedPost.save();
                    console.log("Complited giving coin giveTedBlackCoin")
                } else {
                    tedBlackRecord.status = "Reject TedBlack";
                }

                await tedBlackRecord.save();
                updatedPost.tedBlackCoinData.isFinalized = true;
                await updatedPost.save();
            }
        }, 20 * 60 * 1000); // 20 minutes

        return res.status(200).json({
            success: true,
            message: "TedBlackCoin given and notifications sent for voting."
        });

    } catch (error) {
        console.error("Error in giveTedBlackCoin:", error);
        return res.status(500).json({
            success: false,
            message: `Server error ${error.message}`,
        });
    }
};




exports.voteTedBlackCoin = async (req, res) => {
    try {
        const { postId, voteType, email, token } = req.body;
        const voterId = req.user.userId;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(voterId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!postId) {
            return res.status(200).json({ success: false, message: "Post ID is required" });
        }

        if (!voteType || (voteType !== 'agree' && voteType !== 'disagree')) {
            return res.status(200).json({ success: false, message: "Vote type is required and must be either 'agree' or 'disagree'" });
        }

        if (!email || !token) {
            return res.status(200).json({
                success: false,
                message: "Please provide email and token",
            });
        }

        const post = await Postcreate.findById(postId);

        if (!post) {
            return res.status(200).json({ success: false, message: "Post  not found" });
        }

        const { agree, disagree, voters, isFinalized } = post.tedBlackCoinData;

        if (isFinalized) {
            return res.status(200).json({ success: false, message: "Voting has already ended" });
        }

        if (voters.includes(voterId)) {
            return res.status(200).json({ success: false, message: "You have already voted" });
        }

        if (voteType === 'agree') {
            post.tedBlackCoinData.agree.push(voterId);
        } else if (voteType === 'disagree') {
            post.tedBlackCoinData.disagree.push(voterId);
        } else {
            return res.status(200).json({ success: false, message: "Invalid vote type" });
        }

        post.tedBlackCoinData.voters.push(voterId);
        await post.save();

        return res.status(200).json({ success: true, message: "Vote recorded successfully" });

    } catch (error) {
        console.error("voteTedBlackCoin error:", error);
        return res.status(500).json({ success: false, message: "Server error while voting" });
    }
};




exports.getProfile = async (req, res) => {
    try {
        const { email, token, userId } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const userProfile = await User.findById(userId)
            .populate("userAllFriends", "userName profilePic email")
            .populate("userAllFriends.userId", "userName profilePic email");

        if (!userProfile) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }


        // Fetch all posts by this user, including comments and the is_photography flag
        const posts = await Postcreate.find({ userId })
            .sort({ createdAt: -1 })
            .populate("comments.userId", "userName profilePic email")
            .select("content descriptionText is_photography colorMatrix comments createdAt");

        return res.status(200).json({
            success: true,
            message: "Fetched user profile",
            userProfile: {
                ...userProfile.toObject(),
                posts,
            },
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Server Error while Fetching Profile"
        })
    }
}





// Add this endpoint to handle button responses 
exports.handleTedBlackCoinVote = async (req, res) => {
    try {
        const userId = req.user.userId
        const {
            action,
            postId,
            giverId,
            token,
            email,
        } = req.body;

        console.log(`User ${userId} voted ${action} on TedBlackCoin for post ${postId}`);

        if (!action || !postId || !giverId || !token || !email) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide all fields"
            })
        }


        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const users = await User.findById(userId).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token ",
            });
        }

        if (users.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid  email",
            });
        }


        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(200).json({ success: false, message: "Post not found" });
        }
        if (post.tedBlackCoinData.voters.includes(userId)) {
            return res.status(200).json({ success: false, message: "User already voted" });
        }


        if (post.tedBlackCoinData.isFinalized) {
            return res.status(200).json({ success: false, message: "Voting has already ended" });
        }


        const blackerRecord = await TedBlackers.findOne({
            userId: giverId,
            // userPostId: post._id,
            postUserId: post.userId,
            userPostId: postId,
        });

        console.log("Searching for blacker record with:", {
            userId: giverId,
            postUserId: post.userId,
            userPostId: postId,
        });

        if (!blackerRecord) {
            return res.status(200).json({
                success: false,
                message: "Black record data not found"
            })
        }


        // Process the vote based on action
        if (action === "agree_vote") {
            // Handle agree logic
            console.log("User agreed with the TedBlackCoin");

            blackerRecord.agree = (blackerRecord.agree || 0) + 1;
            // You can update your database here
            // Example: Update vote count, user preferences, etc.
            /*
            await VoteModel.create({
                userId: userId,
                postId: postId,
                giverId: giverId,
                voteType: "agree",
                reason: reason,
                timestamp: new Date() 
            });
            */

            // Send confirmation notification back to user
            const user = await User.findById(userId); // Assuming you have a User model
            if (user && user.fcmToken) {
                await admin.messaging().send({
                    token: user.fcmToken,
                    notification: {
                        title: "Vote Recorded ✅",
                        body: "Thank you for agreeing with the TedBlackCoin decision!"
                    },
                    data: {
                        actionType: "vote_confirmation",
                        originalPostId: postId,
                        voteType: "agree"
                    }
                });
            }

            post.tedBlackCoinData.agree.push(userId);

        } else if (action === "disagree_vote") {
            // Handle disagree logic
            console.log("User disagreed with the TedBlackCoin");

            blackerRecord.disAgree = (blackerRecord.disAgree || 0) + 1;
            // You can update your database here
            /*
            await VoteModel.create({
                userId: userId,
                postId: postId,
                giverId: giverId,
                voteType: "disagree",
                reason: reason,
                timestamp: new Date()
            });
            */

            // Send confirmation notification back to user
            const user = await User.findById(userId);
            if (user && user.fcmToken) {
                await admin.messaging().send({
                    token: user.fcmToken,
                    notification: {
                        title: "Vote Recorded ❌",
                        body: "Thank you for your feedback on the TedBlackCoin decision!"
                    },
                    data: {
                        actionType: "vote_confirmation",
                        originalPostId: postId,
                        voteType: "disagree"
                    }
                });
            }

            post.tedBlackCoinData.disagree.push(userId);
        }

        await blackerRecord.save();
        post.tedBlackCoinData.voters.push(userId);
        await post.save();

        // Optional: Notify the original giver about the vote
        const giver = await User.findById(giverId);
        if (giver && giver.fcmToken) {
            const voterName = await User.findById(userId).select('userName');
            await admin.messaging().send({
                token: giver.fcmToken,
                notification: {
                    title: "Vote Update",
                    body: `${voterName.userName} ${action === 'agree_vote' ? 'agreed' : 'disagreed'} with your TedBlackCoin`
                },
                data: {
                    actionType: "vote_update",
                    postId: postId,
                    voterAction: action
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: `Vote ${action} recorded successfully`,
            // data: {
            //     userId,
            //     postId,
            //     action,
            //     timestamp: new Date().toISOString()
            // }
        });

    } catch (error) {
        console.error('Error handling TedBlackCoin vote:', error);
        return res.status(500).json({
            success: false,
            message: "Error processing vote",
            error: error.message
        });
    }
};

// Route to add in your main router file
// app.post('/api/tedblackcoin/vote', handleTedBlackCoinVote);

exports.count = async (req, res) => {
    try {
        const blackerRecord = await TedBlackers.find()

        if (!blackerRecord) {
            return res.status(200).json({
                sucess: false,
                message: "Black record data not found"
            })
        }
        blackerRecord.agree = (blackerRecord.agree || 0) + 1;
        blackerRecord.disAgree = (blackerRecord.disAgree || 0) + 1;
        return res.status(200).json({
            sucess: true,
            blackerRecord
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Error in controller"
        })
    }
}


exports.getBlackCoinReactionsToMyPosts = async (req, res) => {
    try {
        const myUserId = req.user.userId;

        const { token, email } = req.body;

        if (!token || !email) {
            return res.status.json({
                sucess: false,
                message: "Please Provide all token and email"
            })
        }


        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(myUserId).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token ",
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid  email",
            });
        }

        const reactions = await TedBlackers.find({ postUserId: myUserId })
            .populate("userId", "userName profilePic email")  // who gave the black coin
            .populate("userPostId", "content hashTag createdAt") // the post that got the black coin
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reactions.length,
            data: reactions
        });

    } catch (error) {
        console.error("Error fetching black coin reactions to your posts:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch black coin reactions.",
            error: error.message
        });
    }
};




// Add Swagger Ui
exports.getBlackCoinReactionsByMe = async (req, res) => {
    try {
        const myUserId = req.user.userId;

        const { token, email } = req.body;

        if (!token || !email) {
            return res.status.json({
                sucess: false,
                message: "Please Provide all token and email"
            })
        }


        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(myUserId).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token ",
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid  email",
            });
        }

        const reactions = await TedBlackers.find({ userId: myUserId })
            .populate("userPostId", "content createdAt")
            .populate("postUserId", "userName profilePic")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reactions.length,
            data: reactions,
        });

    } catch (error) {
        console.error("Error fetching black coin reactions by user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch TedBlack reactions made by you.",
            error: error.message
        });
    }
};






exports.sendNoti = async (req, res) => {
    try {
        const { token } = req.body;
        let noti = await admin.messaging().send({
            // topic: "global",
            token: token,
            notification: {
                title: "Test Notification",
                body: "This is a test notification from the server"
            },
            data: {
                key1: "value1",
            },

        });

        return res.status(200).json({
            sucess: true,
            notification: noti,
            message: "Notification sent successfully"
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            sucess: false,
            message: "Server Error while Sending Notification"
        })

    }
}