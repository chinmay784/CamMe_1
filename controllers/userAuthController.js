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
const cron = require('node-cron');
const recent = require("../models/recentFriendSchema");
const { v4: uuidv4 } = require('uuid'); // UUID generator
const totalTedCoinLogicSchema = require('../models/totalTedCoinLogicSchema');
const mapSetting = require("../models/mapSettingSchema")
const ApporachMode = require("../models/ApporachRequestSchema")

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
            success: true,
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
        user.loginStartTime = new Date();
        user.hasExceededLimit = false; // reset on login
        await user.save()
        console.log(fcmToken)
        console.log(user.fcmToken)
        console.log(token)

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
        const userId = req.user.userId;

        // const { password } = req.body;
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide All Details"
            })
        }

        const Token = req.header("Authorization"); // Bearer <token>
        if (!Token) {
            return res.status(401).json({ message: "Token not provided." });
        }

        const rawToken = Token.split(" ")[1];
        const decoded = jwt.decode(rawToken);

        if (!decoded || !decoded.exp) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        const expiresAt = new Date(decoded.exp * 1000); // Safe to use now

        const blacklisted = new BlacklistedToken({ token: rawToken, expiresAt });

        await blacklisted.save();


        // const user = await User.findById(userId);

        // // if(user.password === )
        // const isMatch = await bcrypt.compare(user.password, password);
        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId)

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

        // if (!isMatch) {
        //     return re.status(200).json({
        //         sucess: false,
        //         message: "user Password and input password is not match"
        //     })
        // }


        const now = new Date();

        const sessionDuration = Math.floor((now - userEmail.loginStartTime) / 1000);

        userEmail.totalSessionTime += sessionDuration;
        userEmail.loginStartTime = null; // stop the session timer
        userEmail.hasExceededLimit = false; // reset for next login

        return res.status(200).json({ message: "User logged out successfully." });

    } catch (err) {
        console.error("Logout Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};



exports.getMatchedIntrested = async (req, res) => {
    try {
        const { token, email } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(req.user.userId).select("email");


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
        const { token, email } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }


        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(req.user.userId).select("email");


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
        }).populate("userId"); // Populate user details

        // // Collect all matching hashtags from those users
        // const matchedTags = matchedFilters.flatMap(filter =>
        //     filter.hashTag.filter(tag => userHashTags.includes(tag))
        // );

        // const uniqueTags = [...new Set(matchedTags)];

        return res.status(200).json({
            success: true,
            matchedTags: matchedFilters,
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
        //const { user } = req.body;
        const user = req.user.userId;
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User ID is required",
            });
        }

        const userFilter = await ConnectionFilter.findOne({ userId: user });
        if (!userFilter || !userFilter.location) {
            return res.status(200).json({
                success: false,
                message: "User's location filter not found",
            });
        }

        const { lattitude, longitude } = userFilter.location;

        const matchedFilters = await ConnectionFilter.find({
            userId: { $ne: user }, // Exclude the logged-in user
            "location.lattitude": lattitude,
            "location.longitude": longitude,
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



exports.getAll_Matches_OnBasisOf_Intrest_HashTag_Location = async (req, res) => {
    try {
        const { token, email } = req.body;
        const userId = req.user.userId;
        // const {userId} = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader?.split(" ")[1];

        const userEmail = await User.findById(userId).select("email");
        if (token !== authorizedToken) {
            return res.status(403).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (userEmail.email !== email) {
            return res.status(403).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        const userFilter = await ConnectionFilter.findOne({ userId });
        if (!userFilter) {
            return res.status(200).json({
                success: false,
                message: "User's filter not found",
            });
        }

        const {
            intrestedFiled = [],
            hashTag = [],
            location = {}
        } = userFilter;

        const query = {
            userId: { $ne: userId },
            $or: []
        };

        if (intrestedFiled.length > 0) {
            query.$or.push({ intrestedFiled: { $in: intrestedFiled } });
        }

        if (hashTag.length > 0) {
            query.$or.push({ hashTag: { $in: hashTag } });
        }

        if (location?.lattitude && location?.longitude) {
            query.$or.push({
                "location.lattitude": location.lattitude,
                "location.longitude": location.longitude
            });
        }

        if (query.$or.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No filters to match",
                matchedUsers: []
            });
        }

        const matchedFilters = await ConnectionFilter.find(query)
            .populate("userId");

        return res.status(200).json({
            success: true,
            filtersUsed: {
                intrestedFiled,
                hashTag,
                location,
            },
            matchedUsers: matchedFilters
        });
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in "
        })
    }
};




exports.sendFriendRequest = async (req, res) => {
    try {
        const user = req.user.userId

        const { email, token, reciverId } = req.body;

        //const { reciverId } = req.params;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(user).select("email userName profilePic");

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


        await Notification.create({
            userId: reciverId,
            type: "FriendRequest",
            message: `${userEmail.userName} has sent you a friend request.`,
        });

        // Notify the receiver via Firebase Cloud Messaging

        const reciv = await User.findById(reciverId);
        if (reciv.fcmToken) {
            console.log("Sending FCM notification to:", reciv.fcmToken);
            await admin.messaging().send({
                token: reciv.fcmToken,
                notification: {
                    title: "Friend Request",
                    body: `${userEmail.userName} has sent you a friend request.`,
                },
                data: {
                    actionType: "FriendRequest",
                    senderId: userEmail._id.toString(),
                    reciverId: reciverId.toString(),
                    senderName: String(userEmail.userName), // in case it's not a string
                    senderProfilePic: String(userEmail.profilePic || ""),
                },
            });

        }


        // const receiverSocketId = global.onlineUsers.get(reciverId.toString());

        // if (receiverSocketId) {
        //     global.io.to(receiverSocketId).emit("Receive_friend_request", {
        //         senderId: user,
        //         requestId: request._id
        //     })
        // }

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




//it will br for requested
exports.requestedme = async (req, res) => {
    try {
        const { token, email } = req.body;

        const senderId = req.user.userId
        if (!senderId) {
            return res.status(200).json({
                sucess: false,
                message: " Please provide senderId"
            })
        }


        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(senderId).select("email");


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

        const request = await FriendRequest.find({
            receiver: senderId,
            status: "pending"
        }).populate("sender")

        if (!request) {
            return res.status(200).json({
                sucess: false,
                message: " Request Not found"
            })
        }

        return res.status(200).json({
            sucess: true,
            length: request.length,
            request
        })
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: " Server Error in requested "
        })
    }
}



// done
exports.IrequEst = async (req, res) => {
    try {
        const { token, email } = req.body;
        const senderId = req.user.userId;
        if (!senderId) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide all Details"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(senderId).select("email");


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

        const requistI = await FriendRequest.find({
            sender: senderId,
            //status: "pending",
        }).populate("receiver");


        if (!requistI) {
            return res.status(200).json({
                sucess: false,
                message: " Request Not found"
            })
        }

        return res.status(200).json({
            sucess: true,
            length: requistI.length,
            requistI
        })

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in Irequest"
        })
    }
}





exports.acceptFriendRequest = async (req, res) => {
    try {
        //const { requestId } = req.params;
        const user = req.user.userId;

        const { email, token, requestId } = req.body;
        //const { requestId, user } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(user).select("email userName profilePic");


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

        const request = await FriendRequest.findOne({ sender: requestId, receiver: user });

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


        // const senderSocketId = global.onlineUsers.get(request.sender.toString());

        // if (senderSocketId) {
        //     global.io.to(senderSocketId).emit("friend_request_accepted", {
        //         friendId: user,
        //     });
        // }

        // Send Notification to requestId
        const reqsender = await User.findById(requestId);
        if (reqsender.fcmToken) {
            await admin.messaging().send({
                token: reqsender.fcmToken,
                notification: {
                    title: " Accept Friend Request",
                    body: `${reqsender.userName} has Accept friend request.`,
                },
                data: {
                    actionType: "AcceptFriendRequest",
                    senderId: userEmail._id.toString(),
                    reciverId: requestId.toString(),
                    senderName: String(userEmail.userName), // in case it's not a string
                    senderProfilePic: String(userEmail.profilePic) || "",
                },
            })
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




exports.rejectFriendRequest = async (req, res) => {
    try {
        const user = req.user.userId;
        const { email, token, requestId } = req.body;
        // const {  requestId, user } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(user).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
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


        const request = await FriendRequest.findOne({ sender: requestId, receiver: user });

        request.status = "rejected";
        // 5. Delete the friend request (reject it)
        // await FriendRequest.deleteOne({ _id: request._id });
        await request.save();

        // send Notification to requestId

        return res.status(200).json({
            success: true,
            message: "Friend request rejected"
        });


    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server error in rejectFriendRequest"
        })
    }
}





exports.unFriend = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, unFriendUserId } = req.body;
        //const { unFriendUserId, userId } = req.body;
        if (!email || !token || !unFriendUserId) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide All Details - email and token and unFriendUserId",
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        if (authorizedToken !== token) {
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
        };

        if (!userId || !unFriendUserId) {
            return res.status(400).json({
                success: false,
                message: "Please provide userId and unFriendUserId"
            });
        }

        // 1. Remove unFriendUserId from user's friend list
        await User.findByIdAndUpdate(userId, {
            $pull: { userAllFriends: unFriendUserId }
        });

        // 2. (Optional) Remove userId from unFriendUserId's friend list
        // await User.findByIdAndUpdate(unFriendUserId, {
        //     $pull: { userAllFriends: userId }
        // });

        // 3. Add to 'recent' unfriended list
        const existingRecent = await recent.findOne({ userId, status: "unfriend" });

        if (existingRecent) {
            await recent.findOneAndUpdate(
                { userId },
                { $addToSet: { recentId: unFriendUserId }, status: "unfriend" }
            );
        } else {
            await recent.create({
                userId,
                recentId: [unFriendUserId],
                status: "unfriend"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully unfriended"
        });
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in UnFriend"
        })
    }
}




exports.makeAfriend = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, friendId } = req.body;
        // const { userId, friendId } = req.body;
        if (!email || !token || !friendId) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide All Details - email, token and friendId",
            });
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

        if (!userId || !friendId) {
            return res.status(400).json({
                success: false,
                message: "Please provide both userId and friendId",
            });
        }

        // 1. Add each other as friends (bi-directional)
        await User.findByIdAndUpdate(userId, {
            $addToSet: { userAllFriends: friendId }
        });

        // await User.findByIdAndUpdate(friendId, {
        //     $addToSet: { userAllFriends: userId }
        // });

        // 2. Remove friendId from the recent unfriended list of userId
        await recent.findOneAndUpdate(
            { userId },
            { $pull: { recentId: friendId } }
        );

        return res.status(200).json({
            success: true,
            message: "Successfully made a friend"
        });

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in makeAfriend",
        });
    }
}



// One Logic Api I will write Here Name is (Fetch Recent Page Friends);



exports.cancleMyRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { friendId, email, token } = req.body;
        if (!userId || !friendId) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide userId & friendId"
            })
        };

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
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



        const fetchRequest = await FriendRequest.findOne({
            sender: userId,
            receiver: friendId,
            status: "pending"
        });

        if (!fetchRequest) {
            return res.status(200).json({
                sucess: false,
                message: "Request Not Found"
            })
        };

        await FriendRequest.deleteOne({
            sender: userId,
            receiver: friendId,
            status: "pending"
        });

        const existingRecent = await recent.findOne({ userId, status: "cancleRequest" });

        if (existingRecent) {
            await recent.findOneAndUpdate(
                { userId },
                {
                    $addToSet: { recentId: friendId },
                    status: "cancleRequest"
                }
            );
        } else {
            await recent.create({
                userId,
                recentId: [friendId],
                status: "cancleRequest"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request Cancelled Successfully"
        });

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in cancleMyRequest"
        })
    }
}



exports.fetchAllRecentUserAllFriends = async (req, res) => {
    try {

        const userId = req.user.userId;
        const { email, token } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
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


        const Recent = await recent.find({
            userId: userId,
            status: "unfriend"
        }).populate("recentId", "userName email profilePic");
        return res.status(200).json({
            sucess: true,
            Recent,
        })
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in fetchAllRecentUserAllFriends"
        })
    }
}



exports.fetchAllRecentCancleRequest = async (req, res) => {
    try {

        const userId = req.user.userId;

        const { email, token } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const userEmail = await User.findById(userId).select("email");

        // Compare provided token with authorized token
        if (token !== authorizedToken) {
            return res.status(200).json({
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

        const Recent = await recent.find({
            userId: userId,
            status: "cancleRequest"
        }).populate("recentId", "userName email profilePic"); // specify fields you want from User

        return res.status(200).json({
            success: true,
            Recent,
        });
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            success: false,
            message: "Server Error in fetchAllRecentCancleRequest"
        });
    }
};






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




// Share All User
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

        // if (userEmail.posts.length >= 10) {
        //     userEmail.points = (userEmail.points || 0) + 7;
        //     await userEmail.save();
        // }

        // if (userEmail.posts.length <= 10) {
        //     userEmail.points = (userEmail.points || 0) + 7;
        //     await userEmail.save();
        // }

        userEmail.points = (userEmail.points || 0) + 7;

        const creditsEarned = Math.floor(userEmail.points / 500); // 1 credit per 500 points
        if (creditsEarned > 0) {
            userEmail.credits = (userEmail.credits || 0) + creditsEarned;
            await userEmail.save();
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



exports.deleteAPost = async (req, res) => {
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

        const { postId } = req.body;

        if (!userId || !postId) {
            return res.status(200).json({
                success: false,
                message: "Please provide userId and postId",
            });
        }

        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this post",
            });
        }

        const { tedBlackCount, tedGoldCount, tedSilverCount, tedBronzeCount } = post;

        if (tedBlackCount > 10) {
            const postOwner = await User.findById(userId);
            if (!postOwner) {
                return res.status(404).json({
                    success: false,
                    message: "Post owner not found",
                });
            }

            // Subtract the post's coins from the owner's wallet (but don't let it go below 0)
            postOwner.coinWallet.tedGold = Math.max((postOwner.coinWallet.tedGold || 0) - (tedGoldCount || 0), 0);
            postOwner.coinWallet.tedSilver = Math.max((postOwner.coinWallet.tedSilver || 0) - (tedSilverCount || 0), 0);
            postOwner.coinWallet.tedBronze = Math.max((postOwner.coinWallet.tedBronze || 0) - (tedBronzeCount || 0), 0);

            // Recalculate totalTedCoin (if you're using this logic)
            const goldUnits = Math.floor(postOwner.coinWallet.tedGold / 75);
            const silverUnits = Math.floor(postOwner.coinWallet.tedSilver / 50);
            const bronzeUnits = Math.floor(postOwner.coinWallet.tedBronze / 25);

            postOwner.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

            await postOwner.save();
        }


        // Delete the post
        await Postcreate.deleteOne({
            _id: postId
        });

        // Optionally, you can also remove the post from the user's posts array if you have one
        const user = await User.findById(userId);
        if (user) {
            user.posts = user.posts.filter(post => post.toString() !== postId);
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Post evaluated successfully",
            tedBlackCount,
            tedGoldCount,
            tedSilverCount,
            tedBronzeCount,
        });

    } catch (error) {
        console.error("deleteAPost error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in deleteAPost",
        });
    }
};




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
        const { postId, email, token } = req.body;

        if (!email || !token) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide Email And Token"
            })

        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];

        const giver = await User.findById(giverId).select("email userName profilePic points freeCredit");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (giver.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!giver) {
            return res.status(200).json({
                success: false,
                message: "Giver not found"
            });
        }

        if (!postId) {
            return res.status(200).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        }

        const giverIdStr = giverId.toString();

        // Prevent duplicate TedGold
        if (post.tedGoldGivers?.map(String).includes(giverIdStr)) {
            return res.status(200).json({
                success: false,
                message: "You have already given a coin to this post"
            });
        }

        const postOwner = await User.findById(post.userId);
        if (!postOwner) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found"
            });
        }

        const oldTotal = postOwner.coinWallet.totalTedCoin

        // Award points & credits to giver
        giver.points = (giver.points || 0) + 5;
        const creditsEarned = Math.floor(giver.points / 500);
        if (creditsEarned > 0) {
            giver.freeCredit += creditsEarned;
        }

        // Remove giver from lower tier givers (including tedBlack)
        const tiers = [
            { field: "tedSilverGivers", countField: "tedSilverCount", walletField: "tedSilver" },
            { field: "tedBronzeGivers", countField: "tedBronzeCount", walletField: "tedBronze" },
            { field: "tedBlackGivers", countField: "tedBlackCount", walletField: "tedBlack" }
        ];

        for (const tier of tiers) {
            if (post[tier.field]?.map(String).includes(giverIdStr)) {
                post[tier.field] = post[tier.field].filter(id => id.toString() !== giverIdStr);
                post[tier.countField] = Math.max((post[tier.countField] || 0) - 1, 0);
                postOwner.coinWallet[tier.walletField] = Math.max((postOwner.coinWallet[tier.walletField] || 0) - 1, 0);
            }
        }

        // Add to TedGold
        post.tedGoldGivers = post.tedGoldGivers || [];
        post.tedGoldGivers.push(giverId);
        post.tedGoldCount = (post.tedGoldCount || 0) + 1;

        // === 🧠 UPDATE COIN WALLET INCLUDING tedBlackCount ===
        const allPosts = await Postcreate.find({ userId: postOwner._id });

        let tedGoldCount = 0, tedSilverCount = 0, tedBronzeCount = 0, tedBlackCount = 0;
        allPosts.forEach(p => {
            tedGoldCount += p.tedGoldCount || 0;
            tedSilverCount += p.tedSilverCount || 0;
            tedBronzeCount += p.tedBronzeCount || 0;
            tedBlackCount += p.tedBlackCount || 0;  // <-- Added tedBlackCount
        });

        postOwner.coinWallet.tedGold = tedGoldCount;
        postOwner.coinWallet.tedSilver = tedSilverCount;
        postOwner.coinWallet.tedBronze = tedBronzeCount;
        postOwner.coinWallet.tedBlack = tedBlackCount;  // <-- Set tedBlackCount

        const goldUnits = Math.floor(tedGoldCount / 75);
        const silverUnits = Math.floor(tedSilverCount / 50);
        const bronzeUnits = Math.floor(tedBronzeCount / 25);

        postOwner.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

        console.log("Before", postOwner.coinWallet);

        postOwner.markModified('coinWallet');
        await postOwner.save();
        await giver.save();
        await post.save();

        const newTotal = Math.min(goldUnits, silverUnits, bronzeUnits);

        const coinGenerated = newTotal - oldTotal;

        if (coinGenerated > 0) {
            const followersCount = Array.isArray(postOwner.userAllFriends) ? postOwner.userAllFriends.length : 0;

            const logs = Array.from({ length: coinGenerated }, () => ({
                userId: postOwner._id,
                generatedBy: 'formula-based',
                amount: 1,
                followersCount: followersCount,
                uniqueId: uuidv4(),
            }))

            await totalTedCoinLogicSchema.insertMany(logs);

            postOwner.coinWallet.totalTedCoin = newTotal;
            await postOwner.save();
        }

        return res.status(200).json({
            success: true,
            message: "Switched to TedGold successfully",
            postCoinCounts: {
                tedGoldCount: post.tedGoldCount || 0,
                tedSilverCount: post.tedSilverCount || 0,
                tedBronzeCount: post.tedBronzeCount || 0,
                tedBlackCount: post.tedBlackCount || 0  // Included in response
            },
            ownerWallet: {
                tedGold: postOwner.coinWallet.tedGold,
                tedSilver: postOwner.coinWallet.tedSilver,
                tedBronze: postOwner.coinWallet.tedBronze,
                tedBlack: postOwner.coinWallet.tedBlack,  // Included in response
                totalTedCoin: postOwner.coinWallet.totalTedCoin
            },
            totalTedCoin: newTotal,
        });

    } catch (error) {
        console.error("Error giving TedGold:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in giveTedGoldToPost"
        });
    }
};






exports.TEST = async (req, res) => {
    try {
        const { postId, giverId } = req.body;

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        }

        // Fetch all posts of the post owner
        const allPosts = await Postcreate.find({
            userId: post.userId
        });

        // Aggregate counts
        let tedGoldCount = 0;
        let tedSilverCount = 0;
        let tedBronzeCount = 0;

        allPosts.forEach(p => {
            tedGoldCount += p.tedGoldCount || 0;
            tedSilverCount += p.tedSilverCount || 0;
            tedBronzeCount += p.tedBronzeCount || 0;
        });

        // Fetch the user (post owner)
        const postOwner = await User.findById(post.userId);
        if (!postOwner) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found"
            });
        }

        // Update coinWallet
        postOwner.coinWallet.tedGold = tedGoldCount;
        postOwner.coinWallet.tedSilver = tedSilverCount;
        postOwner.coinWallet.tedBronze = tedBronzeCount;

        const goldUnits = Math.floor(tedGoldCount / 75);
        const silverUnits = Math.floor(tedSilverCount / 50);
        const bronzeUnits = Math.floor(tedBronzeCount / 25);

        postOwner.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

        postOwner.markModified('coinWallet');
        await postOwner.save();

        return res.status(200).json({
            success: true,
            message: "Coin wallet updated successfully",
            length: allPosts.length,
            tedGoldCount,
            tedSilverCount,
            tedBronzeCount,
            coinWallet: postOwner.coinWallet
        });

    } catch (error) {
        console.log("TEST Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error in TEST controller"
        });
    }
}





exports.giveTedSilverPost = async (req, res) => {
    try {
        const giverId = req.user.userId;
        const { postId, email, token } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];

        if (!postId || !giverId) {
            return res.status(200).json({
                success: false,
                message: "Post ID and Giver ID are required"
            });
        }

        const giver = await User.findById(giverId).select("email userName profilePic points freeCredit");
        if (token !== authorizedToken) {
            return res.status(200).json({

                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (giver.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Provided email does not match authorized email",
            });
        }

        if (!giver) {
            return res.status(200).json({
                success: false,
                message: "Giver not found"
            });
        }

        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        }

        const giverIdStr = giverId.toString();
        if (post.tedSilverGivers?.map(String).includes(giverIdStr)) {
            return res.status(200).json({
                success: false,
                message: "You have already given a Silver coin to this post"
            });
        }

        const postOwner = await User.findById(post.userId);
        if (!postOwner) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found"
            });
        }
        const oldTotal = postOwner.coinWallet.totalTedCoin

        // Award points & credits to giver
        giver.points = (giver.points || 0) + 5;
        const creditsEarned = Math.floor(giver.points / 500);
        if (creditsEarned > 0) {
            giver.freeCredit += creditsEarned;
        }

        // Remove giver from other tiers, including tedBlack
        const tiers = [
            { field: "tedGoldGivers", countField: "tedGoldCount", walletField: "tedGold" },
            { field: "tedBronzeGivers", countField: "tedBronzeCount", walletField: "tedBronze" },
            { field: "tedBlackGivers", countField: "tedBlackCount", walletField: "tedBlack" }
        ];

        for (const tier of tiers) {
            if (post[tier.field]?.map(String).includes(giverIdStr)) {
                post[tier.field] = post[tier.field].filter(id => id.toString() !== giverIdStr);
                post[tier.countField] = Math.max((post[tier.countField] || 0) - 1, 0);
                postOwner.coinWallet[tier.walletField] = Math.max((postOwner.coinWallet[tier.walletField] || 0) - 1, 0);
            }
        }

        // Add to TedSilver
        post.tedSilverGivers = post.tedSilverGivers || [];
        post.tedSilverGivers.push(giverId);
        post.tedSilverCount = (post.tedSilverCount || 0) + 1;

        // Update coin wallet sums including tedBlackCount
        const allPosts = await Postcreate.find({ userId: postOwner._id });

        let tedGoldCount = 0, tedSilverCount = 0, tedBronzeCount = 0, tedBlackCount = 0;
        allPosts.forEach(p => {
            tedGoldCount += p.tedGoldCount || 0;
            tedSilverCount += p.tedSilverCount || 0;
            tedBronzeCount += p.tedBronzeCount || 0;
            tedBlackCount += p.tedBlackCount || 0; // Added tedBlackCount sum
        });

        postOwner.coinWallet.tedGold = tedGoldCount;
        postOwner.coinWallet.tedSilver = tedSilverCount;
        postOwner.coinWallet.tedBronze = tedBronzeCount;
        postOwner.coinWallet.tedBlack = tedBlackCount;  // Set tedBlack count

        const goldUnits = Math.floor(tedGoldCount / 75);
        const silverUnits = Math.floor(tedSilverCount / 50);
        const bronzeUnits = Math.floor(tedBronzeCount / 25);
        postOwner.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);
        console.log("Before Silver", postOwner.coinWallet);
        postOwner.markModified('coinWallet');

        await giver.save();
        await postOwner.save();
        await post.save();

        const newTotal = Math.min(goldUnits, silverUnits, bronzeUnits);

        const coinGenerated = newTotal - oldTotal;

        if (coinGenerated > 0) {
            const followersCount = Array.isArray(postOwner.userAllFriends) ? postOwner.userAllFriends.length : 0;

            const logs = Array.from({ length: coinGenerated }, () => ({
                userId: postOwner._id,
                generatedBy: 'formula-based',
                amount: 1,
                followersCount: followersCount,
                uniqueId: uuidv4(),
            }))

            await totalTedCoinLogicSchema.insertMany(logs);

            postOwner.coinWallet.totalTedCoin = newTotal;
            await postOwner.save();
        }


        return res.status(200).json({
            success: true,
            message: "TedSilver given successfully",
            postCoinCounts: {
                tedGoldCount: post.tedGoldCount || 0,
                tedSilverCount: post.tedSilverCount || 0,
                tedBronzeCount: post.tedBronzeCount || 0,
                tedBlackCount: post.tedBlackCount || 0 // include tedBlackCount in response
            },
            ownerWallet: {
                tedGold: tedGoldCount,
                tedSilver: tedSilverCount,
                tedBronze: tedBronzeCount,
                tedBlack: tedBlackCount,
                totalTedCoin: postOwner.coinWallet.totalTedCoin
            },
            totalTedCoin: newTotal,
        });

    } catch (error) {
        console.error("Error giving TedSilver:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in giveTedSilverPost"
        });
    }
};




exports.giveTedBronzePost = async (req, res) => {
    try {
        const giverId = req.user.userId;
        const { postId, email, token } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];

        if (!postId || !giverId) {
            return res.status(200).json({
                success: false,
                message: "Post ID and Giver ID are required",
            });
        }

        const giver = await User.findById(giverId).select("email userName profilePic points freeCredit");
        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Provided token does not match authorized token",
            });
        }

        if (email !== giver.email) {
            return res.status(200).json({
                success: false,
                message: "Provided eMail misMatch ",
            });
        }

        if (!giver) {
            return res.status(200).json({
                success: false,
                message: "Giver not found",
            });
        }

        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found",
            });
        }

        const giverIdStr = giverId.toString();

        // Prevent duplicate Bronze coin
        if (post.tedBronzeGivers?.map(String).includes(giverIdStr)) {
            return res.status(200).json({
                success: false,
                message: "You have already given a Bronze coin to this post",
            });
        }

        const postOwner = await User.findById(post.userId);
        if (!postOwner) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found",
            });
        }

        const oldTotal = postOwner.coinWallet.totalTedCoin

        // Award points & credits to giver
        giver.points = (giver.points || 0) + 5;
        const creditsEarned = Math.floor(giver.points / 500);
        if (creditsEarned > 0) {
            giver.freeCredit += creditsEarned;
        }

        // Remove giver from other tiers: Gold, Silver, Black
        const tiers = [
            { field: "tedGoldGivers", countField: "tedGoldCount", walletField: "tedGold" },
            { field: "tedSilverGivers", countField: "tedSilverCount", walletField: "tedSilver" },
            { field: "tedBlackGivers", countField: "tedBlackCount", walletField: "tedBlack" }, // included Black here
        ];

        for (const tier of tiers) {
            if (post[tier.field]?.map(String).includes(giverIdStr)) {
                post[tier.field] = post[tier.field].filter(id => id.toString() !== giverIdStr);
                post[tier.countField] = Math.max((post[tier.countField] || 0) - 1, 0);
                postOwner.coinWallet[tier.walletField] = Math.max((postOwner.coinWallet[tier.walletField] || 0) - 1, 0);
            }
        }

        // Add to Bronze
        post.tedBronzeGivers = post.tedBronzeGivers || [];
        post.tedBronzeGivers.push(giverId);
        post.tedBronzeCount = (post.tedBronzeCount || 0) + 1;

        // Recalculate coin wallet counts by summing across all posts of the owner
        const allPosts = await Postcreate.find({ userId: postOwner._id });

        let tedGoldCount = 0, tedSilverCount = 0, tedBronzeCount = 0, tedBlackCount = 0;
        allPosts.forEach(p => {
            tedGoldCount += p.tedGoldCount || 0;
            tedSilverCount += p.tedSilverCount || 0;
            tedBronzeCount += p.tedBronzeCount || 0;
            tedBlackCount += p.tedBlackCount || 0; // count Black as well
        });

        postOwner.coinWallet.tedGold = tedGoldCount;
        postOwner.coinWallet.tedSilver = tedSilverCount;
        postOwner.coinWallet.tedBronze = tedBronzeCount;
        postOwner.coinWallet.tedBlack = tedBlackCount;

        const goldUnits = Math.floor(tedGoldCount / 75);
        const silverUnits = Math.floor(tedSilverCount / 50);
        const bronzeUnits = Math.floor(tedBronzeCount / 25);

        // totalTedCoin still depends only on Gold, Silver, Bronze units (black excluded)
        postOwner.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);
        console.log("Before Bronze", postOwner.coinWallet);
        await giver.save();
        await postOwner.save();
        await post.save();

        const newTotal = Math.min(goldUnits, silverUnits, bronzeUnits);

        const coinGenerated = newTotal - oldTotal;

        if (coinGenerated > 0) {
            const followersCount = Array.isArray(postOwner.userAllFriends) ? postOwner.userAllFriends.length : 0;

            const logs = Array.from({ length: coinGenerated }, () => ({
                userId: postOwner._id,
                generatedBy: 'formula-based',
                amount: 1,
                followersCount: followersCount,
                uniqueId: uuidv4(),
            }))

            await totalTedCoinLogicSchema.insertMany(logs);

            postOwner.coinWallet.totalTedCoin = newTotal;
            await postOwner.save();
        }


        return res.status(200).json({
            success: true,
            message: "TedBronze given successfully",
            postCoinCounts: {
                tedGoldCount: post.tedGoldCount || 0,
                tedSilverCount: post.tedSilverCount || 0,
                tedBronzeCount: post.tedBronzeCount || 0,
                tedBlackCount: post.tedBlackCount || 0,  // included Black count in response
            },
            ownerWallet: {
                tedGold: tedGoldCount,
                tedSilver: tedSilverCount,
                tedBronze: tedBronzeCount,
                tedBlack: tedBlackCount,
                totalTedCoin: postOwner.coinWallet.totalTedCoin,
            },
        });
    } catch (error) {
        console.error("Error giving TedBronze:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error in giveTedBronzePost",
        });
    }
};





// exports.giveTedBronzePost = async (req, res) => {
//     try {
//         const giverId = req.user.userId;
//         //const { postId } = req.params;
//         const { email, token, postId } = req.body;

//         if (!email || !token) {
//             return res.status(200).json({
//                 sucess: false,
//                 message: "Please provide Email And Token"
//             })
//         }

//         const authHeader = req.headers.authorization;
//         const authorizedToken = authHeader.split(" ")[1];
//         const userEmail = await User.findById(giverId).select("email");

//         // Compare provided token with authorized token
//         if (token !== authorizedToken) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Provided token does not match authorized token",
//             });
//         }

//         if (userEmail.email !== email) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Provided email does not match authorized email",
//             });
//         }

//         if (!postId) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Post ID is required",
//             });
//         }

//         //  Find the giver
//         const giver = await User.findById(giverId);
//         if (!giver) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Giver not found"
//             });
//         }

//         const post = await Postcreate.findOne({ _id: postId });
//         if (!post) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Post not found"
//             });
//         };

//         if (
//             (post.tedBronzeGivers?.includes(giverId))
//         ) {
//             return res.status(200).json({
//                 success: false,
//                 message: "You have already given a Bronzecoin to this post"
//             });
//         }

//         const receiver = await User.findById(post.userId);
//         if (!receiver) return res.status(200).json({ success: false, message: "Post owner not found" });


//         // if (giver.posts.length >= 10) {
//         //     giver.points = (giver.points || 0) + 5; // Increment points
//         //     await giver.save();
//         // }

//         // if (giver.posts.length <= 10) {
//         //     giver.points = (giver.points || 0) + 5; // Increment points
//         //     await giver.save();
//         // }

//         giver.points = (giver.points || 0) + 5; // Increment points

//         const creditsEarned = Math.floor(giver.points / 500); // 1 credit per 500 points
//         if (creditsEarned > 0) {
//             giver.freeCredit += creditsEarned;
//             await giver.save();
//         }

//         const giverStr = giverId.toString();

//         /* ---------- remove from Gold / Silver if present ---------- */
//         const tiers = [
//             { arr: "tedGoldGivers", cnt: "tedGoldCount", wallet: "tedGold" },
//             { arr: "tedSilverGivers", cnt: "tedSilverCount", wallet: "tedSilver" },
//             { arr: "tedBlackGivers", cnt: "tedBlackCount", wallet: "tedBlack" }
//         ];

//         tiers.forEach(t => {
//             if (post[t.arr]?.includes(giverId)) {
//                 post[t.arr] = post[t.arr].filter(id => id.toString() !== giverStr);
//                 post[t.cnt] = Math.max((post[t.cnt] || 1) - 1, 0);
//                 receiver.coinWallet[t.wallet] =
//                     Math.max((receiver.coinWallet[t.wallet] || 1) - 1, 0);
//             }
//         });

//         /* ---------- add to Bronze tier ---------- */
//         post.tedBronzeGivers = post.tedBronzeGivers || [];
//         post.tedBronzeGivers.push(giverId);
//         post.tedBronzeCount = (post.tedBronzeCount || 0) + 1;
//         receiver.coinWallet.tedBronze = (receiver.coinWallet.tedBronze || 0) + 1;

//         /* ---------- recalc totalTedCoin ---------- */
//         const { tedGold = 0, tedSilver = 0, tedBronze = 0 } = receiver.coinWallet;
//         const goldUnits = Math.floor(tedGold / 75);
//         const silverUnits = Math.floor(tedSilver / 50);
//         const bronzeUnits = Math.floor(tedBronze / 25);
//         receiver.coinWallet.totalTedCoin = Math.min(goldUnits, silverUnits, bronzeUnits);

//         await receiver.save();
//         await post.save();

//         return res.status(200).json({
//             success: true,
//             message: "TedBronze given successfully",
//             counts: {
//                 tedGold: post.tedGoldCount,
//                 tedSilver: post.tedSilverCount,
//                 tedBronze: post.tedBronzeCount,
//                 tedBlack: post.tedBlackCount
//             },
//             toUser: receiver._id
//         });

//     } catch (error) {
//         console.error("Error in giveTedBronzePost:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error in giveTedBronzePost"
//         });
//     }
// };



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


        // if (user.posts.length >= 10) {
        //     user.points = (user.points || 0) + 5; // Increment points
        //     await user.save();
        // }

        // if (user.posts.length <= 10) {
        //     user.points = (user.points || 0) + 5; // Increment points
        //     await user.save();
        // }

        user.points = (user.points || 0) + 5; // Increment points

        const creditsEarned = Math.floor(user.points / 500); // 1 credit per 500 points
        if (creditsEarned > 0) {
            user.freeCredit += creditsEarned;
            await user.save();
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
            hashTags: hashTags,
            notifyUser: [...uniqueGivers],
            agreeUser: [],
            disAgreeUser: [],
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

        // Schedule evaluation in 60 minutes
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
                    postUserId: updatedPost.userId,
                    reasone: updatedPost.tedBlackCoinData.reason,
                    // createdAt: updatedPost.tedBlackCoinData.createdAt
                });



                // tedBlackRecord.agree = agree.length || 0;
                // tedBlackRecord.disAgree = disagree.length || 0;


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


                    // postCreator.coinWallet.tedBlack = (postCreator.coinWallet.tedBlack || 0) + 1;
                    // postCreator.coinWallet.tedGold = (postCreator.coinWallet.tedGold || 0) - 1;
                    // postCreator.coinWallet.tedSilver = (postCreator.coinWallet.tedSilver || 0) - 2;
                    // postCreator.coinWallet.tedBronze = (postCreator.coinWallet.tedBronze || 0) - 3;

                    // here we Updated to
                    // Recalculate coin wallet counts by summing across all posts of the owner
                    const allPosts = await Postcreate.find({ userId: postCreator._id });

                    let tg = 0, ts = 0, tb = 0, tblk = 0;

                    allPosts.forEach(p => {
                        tg += p.tedGoldCount || 0;
                        ts += p.tedSilverCount || 0;
                        tb += p.tedBronzeCount || 0;
                        tblk += p.tedBlackCount || 0;
                    });

                    postCreator.coinWallet.tedGold = tg;
                    postCreator.coinWallet.tedSilver = ts;
                    postCreator.coinWallet.tedBronze = tb;
                    postCreator.coinWallet.tedBlack = tblk;

                    const goldUnit = Math.floor(tg / 75);
                    const silverUnit = Math.floor(ts / 50);
                    const bronzeUnit = Math.floor(tb / 25);
                    postCreator.coinWallet.totalTedCoin = Math.min(goldUnit, silverUnit, bronzeUnit);
                    // This Line
                    await postCreator.save();
                    await updatedPost.save();
                    console.log("Complited giving coin giveTedBlackCoin")
                } else {
                    tedBlackRecord.status = "Reject TedBlack";
                }

                await tedBlackRecord.save();
                updatedPost.tedBlackCoinData.isFinalized = true;
                console.log("Black Coin Voting Ended SucessFully")
                await updatedPost.save();
            }
        }, 60 * 60 * 1000); // 60 minutes

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
// exports.giveTedBlackCoin = async (req, res) => {
//     try {
//         const authorizedUserId = req.user.userId;
//         const { postId, reason, email, token, hashTags } = req.body;

//         if (!postId || !reason || !email || !token) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing postId, reason, email, or token",
//             });
//         }

//         const authHeader = req.headers.authorization;
//         const authorizedToken = authHeader.split(" ")[1];
//         const user = await User.findById(authorizedUserId).select("email");

//         if (token !== authorizedToken) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Invalid token ",
//             });
//         }

//         if (user.email !== email) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Invalid email",
//             });
//         }

//         const post = await Postcreate.findById(postId);
//         if (!post) {
//             return res.status(200).json({ success: false, message: "Post not found" });
//         }

//         if (post.tedBlackGivers?.includes(authorizedUserId)) {
//             return res.status(200).json({
//                 success: false,
//                 message: "You have already given a TedBlackCoin to this post",
//             });
//         }

//         const receiver = await User.findById(post.userId);
//         if (!receiver) {
//             return res.status(200).json({ success: false, message: "Post owner not found" });
//         }

//         const allowedTags = ["spam", "abuse", "misinformation"];

//         if (!allowedTags.includes(hashTags)) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Invalid hashTags. Allowed values are: spam, abuse, misinformation",
//             });
//         }

//         post.tedBlackCoinData = {
//             givenBy: authorizedUserId,
//             reason,
//             createdAt: new Date(),
//             voters: [],
//             agree: [],
//             disagree: [],
//             isFinalized: false,
//             hashTags
//         };
//         await post.save();

//         const allGivers = [
//             ...(post.tedGoldGivers || []),
//             ...(post.tedSilverGivers || []),
//             ...(post.tedBronzeGivers || [])
//         ];

//         const uniqueGivers = [...new Set(allGivers.map(g => g.toString()))];

//         console.log("Unique Givers Print");

//         // Save tracking record in TedBlackers
//         const tedBlackRecord = await TedBlackers.create({
//             userId: authorizedUserId, // The user who gave the TedBlackCoin
//             postUserId: post.userId, // The user who created the post
//             userPostId: postId,
//             status: "OnGoing",
//             notiFied: uniqueGivers.length,
//             agree: 0,
//             disAgree: 0,
//             reasone: reason,
//             hashTags: hashTags
//         });

//         // Notify all unique givers (excluding the blackCoin giver)
//         for (const giverId of uniqueGivers) {
//             if (giverId.toString() !== authorizedUserId.toString()) { // Ensure comparison is safe
//                 const giver = await User.findById(giverId);
//                 if (!giver) continue;

//                 await Notification.create({
//                     userId: giverId,
//                     postId: post._id,
//                     type: "TedBlackCoinVote",
//                     message: `A TedBlackCoin has been given to a post you reacted to. Reason: ${reason}`,
//                     actions: ["Agree", "Disagree"]
//                 });
//                 console.log("Notification created for giver")

//                 const blackCoinGiver = await User.findById(authorizedUserId).select("userName profilePic");

//                 if (giver.fcmToken) {
//                     console.log("Sending FCM Notification to giver");
//                     console.log("Notify user List")

//                     await admin.messaging().send({
//                         token: giver.fcmToken,
//                         notification: {
//                             title: "Vote on TedBlackCoin",
//                             body: `A TedBlackCoin was given to a post you liked by ${blackCoinGiver.userName}. Reason: ${reason}`
//                         },
//                         data: {
//                             postId: post._id.toString(),
//                             reason,
//                             actionType: "TedBlackCoinVote",
//                             giverId: authorizedUserId.toString(),
//                             giverName: blackCoinGiver.userName,
//                             giverProfilePic: blackCoinGiver.profilePic || "",
//                             createdAt: post.tedBlackCoinData?.createdAt?.toISOString() || new Date().toISOString(),
//                             hasButtons: "true",
//                             buttonType: "agree_disagree",
//                             buttons: JSON.stringify([
//                                 {
//                                     id: "agree",
//                                     text: "✅ Agree",
//                                     action: "agree_vote",
//                                     color: "#4CAF50"
//                                 },
//                                 {
//                                     id: "disagree",
//                                     text: "❌ Disagree",
//                                     action: "disagree_vote",
//                                     color: "#F44336"
//                                 }
//                             ]),
//                             click_action: "FLUTTER_NOTIFICATION_CLICK"
//                         },
//                         android: {
//                             notification: {
//                                 title: "Vote on TedBlackCoin",
//                                 body: `A TedBlackCoin was given to a post you liked by ${blackCoinGiver.userName}. Reason: ${reason}`,
//                                 channelId: "tedblackcoin_votes",
//                                 priority: "high",
//                                 defaultSound: true,
//                                 defaultVibrateTimings: true,
//                                 clickAction: "FLUTTER_NOTIFICATION_CLICK"
//                             },
//                             data: {
//                                 postId: post._id.toString(),
//                                 reason,
//                                 actionType: "TedBlackCoinVote",
//                                 giverId: authorizedUserId.toString(),
//                                 giverName: blackCoinGiver.userName,
//                                 giverProfilePic: blackCoinGiver.profilePic || "",
//                                 hasButtons: "true",
//                                 buttonType: "agree_disagree"
//                             }
//                         },
//                     });
//                     console.log("Sending completed FCM Notification to giver with button data");
//                 }
//             }
//         }

//         // Schedule evaluation using node-cron for 20 minutes from now
//         const blackCoinGiverId = authorizedUserId;
//         const now = new Date();
//         const futureTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes from now

//         // Get the specific minute, hour, day of month, month, and day of week for the cron string
//         const minute = futureTime.getMinutes();
//         const hour = futureTime.getHours();
//         const dayOfMonth = futureTime.getDate();
//         const month = futureTime.getMonth() + 1; // getMonth() is 0-indexed
//         const dayOfWeek = futureTime.getDay(); // Sunday - 0, Saturday - 6

//         // Construct the cron string for the exact time
//         // M H D M W (Minute, Hour, Day of Month, Month, Day of Week)
//         const cronPattern = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

//         console.log(`Scheduling cron job with pattern: "${cronPattern}" for postId: ${postId}`);

//         // Create a unique cron job name for each task
//         const cronJobName = `tedBlackCoinEvaluation_${postId}_${Date.now()}`;

//         cron.schedule(cronPattern, async () => { // <--- CHANGE IS HERE: Pass the cron string
//             console.log(`Running scheduled job for postId: ${postId} at ${new Date()}`);
//             try {
//                 const updatedPost = await Postcreate.findById(postId);

//                 if (updatedPost && updatedPost.tedBlackCoinData && !updatedPost.tedBlackCoinData.isFinalized) {
//                     const { agree, disagree } = updatedPost.tedBlackCoinData;
//                     const totalVotes = agree.length + disagree.length;
//                     const agreePercentage = totalVotes > 0 ? (agree.length / totalVotes) * 100 : 0;
//                     console.log(`Inside node-cron job for postId: ${postId}`);

//                     const tedBlackRecord = await TedBlackers.findOne({
//                         userPostId: postId,
//                         reasone: updatedPost.tedBlackCoinData.reason,
//                         status: "OnGoing"
//                     });

//                     if (tedBlackRecord) {
//                         tedBlackRecord.agree = agree.length || 0;
//                         tedBlackRecord.disAgree = disagree.length || 0;

//                         if (agreePercentage >= 70) {
//                             const postCreator = await User.findById(updatedPost.userId);
//                             if (postCreator) {
//                                 console.log("Initial state black coin giveTedBlackCoin");
//                                 const updatedTiers = [
//                                     { arr: "tedGoldGivers", cnt: "tedGoldCount", wallet: "tedGold" },
//                                     { arr: "tedSilverGivers", cnt: "tedSilverCount", wallet: "tedSilver" },
//                                     { arr: "tedBronzeGivers", cnt: "tedBronzeCount", wallet: "tedBronze" },
//                                 ];

//                                 for (const tier of updatedTiers) {
//                                     if (updatedPost[tier.arr] && updatedPost[tier.arr].includes(blackCoinGiverId)) {
//                                         updatedPost[tier.arr] = updatedPost[tier.arr].filter(id => id.toString() !== blackCoinGiverId.toString());
//                                         updatedPost[tier.cnt] = Math.max((updatedPost[tier.cnt] || 1) - 1, 0);
//                                         postCreator.coinWallet[tier.wallet] = Math.max((postCreator.coinWallet[tier.wallet] || 1) - 1, 0);
//                                     }
//                                 }

//                                 tedBlackRecord.status = "Accept TedBlack";

//                                 updatedPost.tedBlackGivers = updatedPost.tedBlackGivers || [];
//                                 if (!updatedPost.tedBlackGivers.includes(blackCoinGiverId)) {
//                                     updatedPost.tedBlackGivers.push(blackCoinGiverId);
//                                 }
//                                 updatedPost.tedBlackCount = (updatedPost.tedBlackCount || 0) + 1;

//                                 postCreator.coinWallet.tedBlack = (postCreator.coinWallet.tedBlack || 0) + 1;
//                                 postCreator.coinWallet.tedGold = Math.max((postCreator.coinWallet.tedGold || 0) - 1, 0);
//                                 postCreator.coinWallet.tedSilver = Math.max((postCreator.coinWallet.tedSilver || 0) - 2, 0);
//                                 postCreator.coinWallet.tedBronze = Math.max((postCreator.coinWallet.tedBronze || 0) - 3, 0);

//                                 await postCreator.save();
//                                 console.log("Completed giving coin giveTedBlackCoin");
//                             }
//                         } else {
//                             tedBlackRecord.status = "Reject TedBlack";
//                         }
//                         await tedBlackRecord.save();
//                     }

//                     updatedPost.tedBlackCoinData.isFinalized = true;
//                     await updatedPost.save();
//                 }
//             } catch (cronError) {
//                 console.error(`Error in scheduled TedBlackCoin evaluation for postId ${postId}:`, cronError);
//             }
//         }, {
//             scheduled: true,
//             timezone: "Asia/Kolkata",
//             name: cronJobName
//         });

//         return res.status(200).json({
//             success: true,
//             message: "TedBlackCoin given and notifications sent for voting. Evaluation scheduled.",
//         });

//     } catch (error) {
//         console.error("Error in giveTedBlackCoin:", error);
//         return res.status(500).json({
//             success: false,
//             message: `Server error ${error.message}`,
//         });
//     }
// };





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




exports.getProfileBasedOnUserId = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "Please provide userId",
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





        users.points = (users.points || 0) + 15;
        await users.save();


        const creditsEarned = Math.floor(users.points / 500);
        if (creditsEarned) {
            users.freeCredit = (users.freeCredit || 0) + creditsEarned;
            await users.save();
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
            blackerRecord.agreeUser.push(userId)
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
            blackerRecord.disAgreeUser.push(userId)
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





exports.getBlackCoinReactionsToMyPosts = async (req, res) => {
    try {
        const myUserId = req.user.userId;

        const { token, email } = req.body;

        if (!token || !email) {
            return res.status(400).json({
                success: false,
                message: "Please provide both token and email."
            });
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(myUserId).select("email");

        if (token !== authorizedToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }

        if (user.email !== email) {
            return res.status(401).json({
                success: false,
                message: "Invalid email.",
            });
        }

        const reactions = await TedBlackers.find({ postUserId: myUserId })
            .populate("userId", "userName profilePic email")              // Who gave the black coin
            .populate("userPostId", "content hashTag createdAt")          // The post that received the black coin
            .populate("notifyUser", "userName profilePic email")          // Users who were notified
            .populate("agreeUser", "userName profilePic email")           // Users who agreed
            .populate("disAgreeUser", "userName profilePic email")        // Users who disagreed
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
            return res.status(400).json({
                success: false,
                message: "Please provide both token and email."
            });
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(myUserId).select("email");

        if (token !== authorizedToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }

        if (user.email !== email) {
            return res.status(401).json({
                success: false,
                message: "Invalid email.",
            });
        }

        const reactions = await TedBlackers.find({ userId: myUserId })
            .populate("userPostId", "content hashTag createdAt")          // The post that received the TedBlackCoin
            .populate("postUserId", "userName profilePic email")          // The post's creator
            .populate("notifyUser", "userName profilePic email")          // Users who were notified
            .populate("agreeUser", "userName profilePic email")           // Users who agreed
            .populate("disAgreeUser", "userName profilePic email")        // Users who disagreed
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



// Not complited Properly (Extra Add On Notification )
exports.getNotiFicationsOnBasisUserId = async (req, res) => {
    try {
        const userId = req.user.userId;
        // const { userId } = req.body
        const { token, email } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(userId).select("email");

        if (token !== authorizedToken) {
            return res.status(200).json({
                sucess: false,
                message: "InValid Token"
            })
        }


        if (user.email !== email) {
            return res.status(200).json({
                sucess: false,
                message: "User Email Mis-Match"
            })
        }

        const notification = await Notification.find({ userId: userId })
            .sort({ createdAt: -1 })
            .populate("userId", "userName profilePic email")
            .populate("postId", "content descriptionText is_photography colorMatrix createdAt");

        if (!notification || notification.length === 0) {
            return res.status(200).json({
                sucess: false,
                message: "No notifications found for this user"
            });
        }

        return res.status(200).json({
            sucess: true,
            count: notification.length,
            notification: notification
        });

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in Fetch Notifications"
        })
    }
}




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



// Utility: Haversine distance calculation
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

exports.fetchProfileLocations = async (req, res) => {
    try {
        const userId = req.user.userId
        const { distance } = req.body;
        const { token, email, profileDisplay } = req.body;
        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(userId).select("email");
        if (token !== authorizedToken) {
            return res.status(401).json({
                sucess: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(401).json({
                sucess: false,
                message: "Invalid email"
            });
        }

        await mapSetting.findOneAndUpdate(
            { userId },
            { profileDisplay },
            { upsert: true, new: true }
        );

        const connections = await ConnectionFilter.find({ userId });

        if (!connections.length || !connections[0].location) {
            return res.status(404).json({
                success: false,
                message: "Location not found for this user."
            });
        }


        const userLat = connections[0].location.lattitude;
        const userLon = connections[0].location.longitude;

        if (profileDisplay === true) {

            // Get all other users’ locations
            // const allConnections = await ConnectionFilter.find({
            //     userId: { $ne: userId }, // Exclude the current user
            //     location: { $exists: true }
            // }).populate('userId', 'profilePic posts fullName userName'); // <-- Only populate profilePic

            const allConnections = await ConnectionFilter.find({
                userId: { $ne: userId },
                location: { $exists: true }
            }).populate({
                path: 'userId',
                select: 'profilePic posts fullName userName',
                populate: {
                    path: 'posts',
                    model: 'Postcreate', // Replace if your Post model has a different name
                    //select: 'caption image createdAt' // Optional: Limit fields you want from each post
                }
            });


            // Filter those within the distance
            const nearbyUsers = allConnections.filter(conn => {
                const loc = conn.location;
                if (!loc || loc.lattitude == null || loc.longitude == null) return false;

                const dist = getDistanceFromLatLonInKm(
                    userLat,
                    userLon,
                    loc.lattitude,
                    loc.longitude
                );
                return dist <= distance;
            });


            return res.status(200).json({
                success: true,
                count: nearbyUsers.length,
                users: nearbyUsers
            });
        }

        return res.status(200).json({
            sucess: true,
            message: "You Have To Enabled The profileDisplay"
        })

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in FetchProfileLocations"
        })
    }
}



exports.apporachModeToAUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { apporachId, email, token, profileDisplay, apporachMode } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(userId)

        if (token !== authorizedToken) {
            return res.status(401).json({
                sucess: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(401).json({
                sucess: false,
                message: "Invalid email"
            });
        }

        if (!apporachId) {
            return res.status(400).json({
                sucess: false,
                message: "Please provide apporachId"
            });
        }


        await mapSetting.findOneAndUpdate(
            { userId },
            { profileDisplay, apporachMode },
            { upsert: true, new: true }
        );


        if (profileDisplay === true && apporachMode === true) {
            await Notification.create({
                userId: apporachId,
                type: "Approval",
                message: `User ${user.userName} has sent an approach request.`,
            });

            const apporachUser = await User.findById(apporachId)

            if (!apporachUser) {
                return res.status(404).json({
                    sucess: false,
                    message: "Approach user not found"
                });
            }

            // Send FCM notification to the apporach user
            if (apporachUser.fcmToken) {
                await admin.messaging().send({
                    token: apporachUser.fcmToken,
                    notification: {
                        title: "New Approach Request",
                        body: `User ${user.userName} has sent you an approach request.`,
                    },
                    data: {
                        actionType: "Approval",
                        giverId: userId.toString(),
                        giverName: user.userName,
                        giverProfilePic: user.profilePic || "",
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
                            title: "New Approach Request",
                            body: `User ${user.userName} has sent you an approach request.`,
                            priority: "high",
                            defaultSound: true,
                            defaultVibrateTimings: true,
                            clickAction: "FLUTTER_NOTIFICATION_CLICK"
                        },
                        data: {
                            actionType: "Approval",
                            giverId: userId.toString(),
                            giverName: user.userName,
                            giverProfilePic: user.profilePic || "",
                            hasButtons: "true",
                            buttonType: "agree_disagree"
                        }
                    },
                });
            }

            return res.status(200).json({
                success: true,
                message: "Approach request sent successfully",
            });
        }

        return res.status(200).json({
            sucess: true,
            message: "Please Enabled profileDisplay and apporachMode"
        })

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server In Apporach Mode "
        })
    }
}




exports.handelApporachVote = async (req, res) => {
    try {
        const userId = req.user.userId
        const { email, token, action } = req.body;
        console.log(userId);

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(userId)

        if (!userId) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide userId"
            })
        };

        if (token !== authorizedToken) {
            return res.status(401).json({
                sucess: false,
                message: "Invalid token"
            });
        };

        if (user.email !== email) {
            return res.status(401).json({
                sucess: false,
                message: "Invalid email"
            });
        };

        const connections = await ConnectionFilter.find({ userId });

        if (!connections.length || !connections[0].location) {
            return res.status(404).json({
                success: false,
                message: "Location not found for this user."
            });
        };

        const userLat = connections[0].location.lattitude;
        const userLon = connections[0].location.longitude;

        if (action === "agree_vote") {
            // Handle agree logic
            console.log("User agreed with the ApporachMode");

            // Fetch Users Data
            const user = await User.findById(userId).populate("posts");


            return res.status(200).json({
                sucess: true,
                message: "User agreed with the ApporachMode",
                userLat,
                userLon,
                user,
            })

        } else if (action === "disagree_vote") {
            // Handle disagree logic
            console.log("User disagreed with the ApporachMode");


            return res.status(200).json({
                sucess: true,
                message: "User disagreed with the ApporachMode"
            })
        };
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in Handling Approach Vote"
        })
    }
}



exports.sendReqinApporach = async (req, res) => {
    try {
        const { email, token, requestId, apporachMode } = req.body;
        // const userId = req.user.userId
        const { userId } = req.body
        // const authHeader = req.headers.authorization;
        // const authorizedToken = authHeader && authHeader.split(" ")[1];
        const user = await User.findById(userId);
        const reqUser = await User.findById(requestId);

        // if (token !== authorizedToken) {
        //     return res.status(401).json({
        //         sucess: false,
        //         message: "Invalid token"
        //     });
        // }

        // if (user.email !== email) {
        //     return res.status(401).json({
        //         sucess: false,
        //         message: "Invalid email"
        //     });
        // }

        if (!userId) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide userId"
            })
        }

        if (!requestId) {
            return res.status(200).json({
                sucess: false,
                message: "Please provide requestId"
            })
        }

        if (apporachMode === true || apporachMode === "true") {
            const isExistingApporachRequest = await ApporachMode.findOne({
                sender: userId,
                receiver: requestId,
                status: "pending"
            })

            if (isExistingApporachRequest) {
                return res.status(200).json({
                    sucess: false,
                    message: "Approach Request Already Send"
                })
            }

            await ApporachMode.create({
                sender: userId,
                receiver: requestId,
                status: "pending",
            });


            await Notification.create({
                userId: requestId,
                type: "Approach",
                message: `${user.userName} has sent you a Approach .`,
            });

            if (reqUser.fcmToken) {
                await admin.messaging().send({
                    token: reqUser.fcmToken,
                    notification: {
                        title: "Approach mode",
                        body: `${user.userName} has sent you a Approach .`,
                    },
                    data: {
                        actionType: "Approach",
                        senderId: user._id.toString(),
                        reciverId: reqUser.toString(),
                        senderName: String(user.userName), // in case it's not a string
                        senderProfilePic: String(user.profilePic || ""),
                    },
                });

                return res.status(200).json({
                    sucess: true,
                    message: "Req Approach Send"
                })
            }
        } else {
            return res.status(200).json({
                sucess: false,
                message: "Please Turn on the apporachMode"
            })
        }

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in make Requist"
        })
    }
}



exports.acceptReqApporach = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, requestId } = req.body;
        //const { requestId, user } = req.body;
        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(userId);
        const reqUser = await User.findById(requestId);

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "Please provide userId"
            });
        };

        if (!requestId) {
            return res.status(200).json({
                success: false,
                message: "Please provide requestId"
            });
        };

        const ReqApporach = await ApporachMode.findOne({ sender: requestId, receiver: userId });

        if (!ReqApporach) {
            return res.status(200).json({
                success: false,
                message: "Approach request not found."
            });
        }

        // ReqApporach.status = "accepted";
        // await ReqApporach.save();



        const connections = await ConnectionFilter.find({ userId });

        if (!connections.length || !connections[0].location) {
            return res.status(200).json({
                success: false,
                message: "Location not found for this user."
            });
        };

        const userLat = connections[0].location.lattitude;
        const userLon = connections[0].location.longitude;

        if (reqUser.fcmToken) {
            await admin.messaging().send({
                token: reqUser.fcmToken,
                notification: {
                    title: "Approach Accepted",
                    body: `${user.userName} has accepted your approach request.`,
                },
                data: {
                    actionType: "Approach",
                    senderId: user._id.toString(),
                    receiverId: reqUser._id.toString(),
                    senderName: String(user.userName),
                    senderProfilePic: String(user.profilePic || ""),
                    userLat: userLat.toString(),
                    userLon: userLon.toString(),
                    click_action: "FLUTTER_NOTIFICATION_CLICK"
                },
                android: {
                    notification: {
                        title: "Approach Accepted",
                        body: `${user.userName} has accepted your approach request.`,
                        priority: "high",
                        defaultSound: true,
                        defaultVibrateTimings: true,
                        clickAction: "FLUTTER_NOTIFICATION_CLICK"
                    }
                }
            });
        }
        ReqApporach.status = "accepted";
        await ReqApporach.save();
        return res.status(200).json({
            sucess: true,
            message: "Approach Accepted",
        })
    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in Accept Request apporach"
        })
    }
}



exports.rejectReqApporach = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, requestId } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];

        const user = await User.findById(userId);
        const reqUser = await User.findById(requestId);

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "Please provide userId"
            });
        }

        if (!requestId) {
            return res.status(200).json({
                success: false,
                message: "Please provide requestId"
            });
        }

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid email"
            });
        }

        const ReqApporach = await ApporachMode.findOne({ sender: requestId, receiver: userId });
        if (!ReqApporach) {
            return res.status(200).json({
                success: false,
                message: "No approach request found"
            });
        }

        ReqApporach.status = "rejected";
        await ReqApporach.save();

        // Send FCM notification to request user only
        if (reqUser.fcmToken) {
            await admin.messaging().send({
                token: reqUser.fcmToken,
                notification: {
                    title: "Approach Rejected",
                    body: `${user.userName} has rejected your approach request.`,
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: "Approach Rejected"
        });

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            success: false,
            message: "Server Error in rejectReqApporach"
        });
    }
};



exports.ReqApporachShow = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(userId);

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid email"
            });
        }

        const ReqApporach = await ApporachMode.find({ receiver: userId, status: "pending" }).populate("sender")
        if (!ReqApporach) {
            return res.status(200).json({
                sucess: false,
                message: "Apporach Not Found",
            })
        }

        return res.status(200).json({
            sucess: true,
            ReqApporach,
        })

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in ReqApporachShow"
        })
    }
}



exports.fetchFriendsApporachController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token } = req.body;
        if (!email || !token || !userId) {
            return res.status(200).json({
                sucess: false,
                message: "Please Provide email or token or userId"
            })
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(userId).populate("userAllFriends", "userName fullName email profilePic");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid email"
            });
        }

        // fetch all user_Friends_List
        const friend_List = user.userAllFriends
        return res.status(200).json({
            sucess: true,
            friend_List,
        })

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in FetchFriendsApporach"
        })
    }
}

// This is not Need for API
exports.apporachModeProtectorOn = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, token, apporachMode } = req.body;

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(userId).populate("userAllFriends", "userName fullName email profilePic");

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (apporachMode === true || apporachMode === "true") {

            // fetch friends Locations and send 
            const allfriends = user.userAllFriends

            let Location = await Promise.all(
                allfriends.map(async (frnd) => {
                    const frndLocation = await ConnectionFilter.find({ userId: frnd._id });
                    return {
                        lattitude: frndLocation[0].location.lattitude,
                        longitude: frndLocation[0].location.longitude
                    };
                })
            );

            return res.status(200).json({
                sucess: true,
                message: "Inside in Apporach Mode",
                Location
            })
        } else {
            return res.status(200).json({
                sucess: false,
                message: "Please turn on apporach Mode"
            })
        }

    } catch (error) {
        console.log(error, error.message);
        return res.status(500).json({
            sucess: false,
            message: "Server Error in apporach Mode On "
        })
    }
}




const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = angle => (Math.PI / 180) * angle;
    const R = 6371; // Radius of Earth in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

exports.sendLiveLocationWithInyourFriends = async (req, res) => {
    try {
        const userId = req.user.userId
        const { email, token, data } = req.body;

        if (!email || !token || !data) {
            return res.status(200).json({
                success: false,
                message: `Please Provide all Fields`
            });
        }

        const authHeader = req.headers.authorization;
        const authorizedToken = authHeader.split(" ")[1];
        const user = await User.findById(userId)

        if (token !== authorizedToken) {
            return res.status(200).json({
                success: false,
                message: "Invalid token"
            });
        }

        if (user.email !== email) {
            return res.status(200).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (!userId || !Array.isArray(data) || data.length === 0) {
            return res.status(200).json({
                success: false,
                message: "User ID and data (array of friend IDs) are required"
            });
        }

        const sender = await User.findById(userId);
        const senderLocation = await ConnectionFilter.findOne({ userId });

        if (!senderLocation?.location) {
            return res.status(200).json({
                success: false,
                message: "Sender location not found"
            });
        }

        const senderLat = senderLocation.location.lattitude;
        const senderLon = senderLocation.location.longitude;

        let notifiedCount = 0;
        let notifiedUsers = [];

        for (const friendId of data) {
            const friendLocationDoc = await ConnectionFilter.findOne({ userId: friendId });
            if (!friendLocationDoc?.location) continue;

            const friendLat = friendLocationDoc.location.lattitude;
            const friendLon = friendLocationDoc.location.longitude;

            const distance = haversineDistance(senderLat, senderLon, friendLat, friendLon);

            if (distance <= 5) {
                const friend = await User.findById(friendId);
                if (friend?.fcmToken) {
                    await admin.messaging().send({
                        token: friend.fcmToken,
                        notification: {
                            title: "Live Location Shared",
                            body: `${sender.userName} shared their live location with you.`,
                        },
                        data: {
                            actionType: "LiveLocation",
                            senderId: sender._id.toString(),
                            senderName: sender.userName,
                            lat: senderLat.toString(),
                            lon: senderLon.toString(),
                            click_action: "FLUTTER_NOTIFICATION_CLICK"
                        },
                        android: {
                            notification: {
                                priority: "high",
                                defaultSound: true,
                                defaultVibrateTimings: true,
                            }
                        }
                    });
                    notifiedCount++;
                    notifiedUsers.push({ friendId, friendName: friend.userName, distance: distance.toFixed(2) });
                    console.log("Execute This Block")
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Live location sent to ${notifiedCount} friend(s) within 5km`,
            notifiedUsers
        });

    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server Error in sendLiveLocationWithInyourFriends"
        });
    }
};

