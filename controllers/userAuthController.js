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
        const { email, otp } = req.body;

        if (!email || !otp) {
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

        const { reciverId } = req.params;

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
        const { requestId } = req.params;
        const user = req.user.userId;

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
        const { description, visibility, hashTag, appliedFilter, filteredImageUrl, is_photography } = req.body;
        const userId = req.user.userId;

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

        // Create post document
        const newPost = await Postcreate.create({
            userId,
            content,
            visibility: visibilityBoolean,
            hashTag: Array.isArray(hashTag) ? hashTag : hashTag ? [hashTag] : [],
            appliedFilter: isImageContent ? (appliedFilter || 'normal') : 'normal',
            filteredImageUrl: isImageContent ? filteredImageUrl : " ",
            is_photography: isImageContent,
        });

        await User.findByIdAndUpdate(userId, {
            $push: { posts: newPost._id }
        });

        return res.status(201).json({
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
        const { postId, friendId } = req.params;

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




exports.getAllPosts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const posts = await Postcreate.find({ userId }).populate("userId", "fullName userName profilePic").sort({ createdAt: -1 });

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "User Not found",
            })
        }

        if (!posts) {
            return res.status(200).json({
                success: false,
                message: "No posts found",
            });
        }

        return res.status(200).json({
            success: true,
            posts,
        });
    } catch (error) {
        console.error("Error in getAllPosts:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



exports.giveTedGoldToPost = async (req, res) => {
    try {
        const giverId = req.user.userId;
        const { postId } = req.params;

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        }

        if (
            (post.tedGoldGivers?.includes(giverId)) ||
            (post.tedSilverGivers?.includes(giverId)) ||
            (post.tedBronzeGivers?.includes(giverId))
        ) {
            return res.status(200).json({
                success: false,
                message: "You have already given a coin to this post"
            });
        }

        const receiver = await User.findOne({ _id: post.userId });
        if (!receiver) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found"
            });
        }

        receiver.coinWallet.tedGold += 1;
        // 5. Recalculate and update totalTedCoin
        const { tedGold, tedSilver, tedBronze } = receiver.coinWallet;
        const totalGoldUnits = Math.floor(tedGold / 75);
        const totalSilverUnits = Math.floor(tedSilver / 50);
        const totalBronzeUnits = Math.floor(tedBronze / 25);
        const calculatedTotal = Math.min(totalGoldUnits, totalSilverUnits, totalBronzeUnits);

        receiver.coinWallet.totalTedCoin = calculatedTotal;

        // 6. Update post data
        post.tedGoldGivers = post.tedGoldGivers || [];
        post.tedGoldGivers.push(giverId);
        post.tedGoldCount = (post.tedGoldCount || 0) + 1;

        // 7. Save both
        await receiver.save();
        await post.save();

        return res.status(200).json({
            success: true,
            message: "TedGold given successfully",
            updatedTedGoldCount: post.tedGoldCount,
            toUser: receiver._id,
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
        const { postId } = req.params;

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        };


        if (
            (post.tedGoldGivers?.includes(giverId)) ||
            (post.tedSilverGivers?.includes(giverId)) ||
            (post.tedBronzeGivers?.includes(giverId))
        ) {
            return res.status(200).json({
                success: false,
                message: "You have already given a coin to this post"
            });
        }

        const receiver = await User.findOne({ _id: post.userId });
        if (!receiver) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found"
            });
        };


        receiver.coinWallet.tedSilver += 1;


        // 5. Recalculate and update totalTedCoin
        const { tedGold, tedSilver, tedBronze } = receiver.coinWallet;
        const totalGoldUnits = Math.floor(tedGold / 75);
        const totalSilverUnits = Math.floor(tedSilver / 50);
        const totalBronzeUnits = Math.floor(tedBronze / 25);
        const calculatedTotal = Math.min(totalGoldUnits, totalSilverUnits, totalBronzeUnits);

        receiver.coinWallet.totalTedCoin = calculatedTotal;


        // 6. Update post data
        post.tedSilverGivers = post.tedSilverGivers || [];
        post.tedSilverGivers.push(giverId);
        post.tedSilverCount = (post.tedSilverCount || 0) + 1;


        // 7. Save both
        await receiver.save();
        await post.save();


        return res.status(200).json({
            success: true,
            message: "TedSilver given successfully",
            updatedTedSilverCount: post.tedSilverCount,
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
        const { postId } = req.params;

        const post = await Postcreate.findOne({ _id: postId });
        if (!post) {
            return res.status(200).json({
                success: false,
                message: "Post not found"
            });
        };

        if (
            (post.tedGoldGivers?.includes(giverId)) ||
            (post.tedSilverGivers?.includes(giverId)) ||
            (post.tedBronzeGivers?.includes(giverId))
        ) {
            return res.status(200).json({
                success: false,
                message: "You have already given a coin to this post"
            });
        }

        const receiver = await User.findOne({ _id: post.userId });

        if (!receiver) {
            return res.status(200).json({
                success: false,
                message: "Post owner not found"
            });
        }

        receiver.coinWallet.tedBronze += 1;


        // 5. Recalculate and update totalTedCoin
        const { tedGold, tedSilver, tedBronze } = receiver.coinWallet;

        const totalGoldUnits = Math.floor(tedGold / 75);
        const totalSilverUnits = Math.floor(tedSilver / 50);
        const totalBronzeUnits = Math.floor(tedBronze / 25);
        const calculatedTotal = Math.min(totalGoldUnits, totalSilverUnits, totalBronzeUnits);

        receiver.coinWallet.totalTedCoin = calculatedTotal;


        // 6. Update post data
        post.tedBronzeGivers = post.tedBronzeGivers || [];
        post.tedBronzeGivers.push(giverId);
        post.tedBronzeCount = (post.tedBronzeCount || 0) + 1;


        // 7. Save both
        await receiver.save();
        await post.save();


        return res.status(200).json({
            success: true,
            message: "TedBronze given successfully",
            updatedTedBronzeCount: post.tedBronzeCount,
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



// Lot of work pending is here
exports.giveTedBlackCoin = async (req, res) => {
    try {
        const giverId = req.user.userId;  // Authorized user
        const { postId } = req.params;
        const { reason } = req.body;  // Reason for giving TedBlackCoin

        // Check if the post exists
        const post = await Postcreate.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if TedBlackCoin voting is already active
        if (post.tedBlackCoinData && post.tedBlackCoinData.status === 'pending') {
            return res.status(400).json({
                success: false,
                message: "TedBlackCoin voting is already active for this post"
            });
        }

        // Initialize the TedBlackCoin voting data
        const votingDuration = 60 * 60 * 1000; // 1 hour in milliseconds
        const votingEndsAt = new Date(Date.now() + votingDuration);

        // Add TedBlackCoin data to the post
        post.tedBlackCoinData = {
            givenBy: giverId,
            reason: reason,
            givenAt: Date.now(),
            votingEndsAt: votingEndsAt,
            votes: [],
            status: 'pending'
        };

        // Notify users who have given TedGold, TedSilver, or TedBronze to the post
        const notifiedUsers = new Set();

        // Check for TedGold, TedSilver, and TedBronze givers
        const coinGivers = [
            ...post.tedGoldGivers,
            ...post.tedSilverGivers,
            ...post.tedBronzeGivers
        ];

        for (const userId of coinGivers) {
            if (userId !== giverId && !notifiedUsers.has(userId)) {
                // Notify the user (you can implement your notification logic here)
                await Notification.create({
                    userId: userId,
                    message: `A TedBlackCoin has been given to your post! Reason: ${reason}. Please vote "Agree" or "Disagree".`,
                    postId: postId,
                    type: 'TedBlackCoinVoting',
                    status: 'unread'
                });

                notifiedUsers.add(userId);
            }
        }

        // Save the post with TedBlackCoin data
        await post.save();

        return res.status(200).json({
            success: true,
            message: "TedBlackCoin voting initiated successfully",
            votingEndsAt: votingEndsAt
        });

    } catch (error) {
        console.error("Error in giveTedBlackCoin:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error while giving TedBlackCoin"
        });
    }
};





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
        const { descripition, is_closeFriends } = req.body;
        const userId = req.user.userId;
        const image = req.files;

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

        return res.status(201).json({
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



exports.getViewYourMoment = async (req, res) => {
    try {
        const userId = req.user.userId;

        const yourMoment = await Moment.find({ userId })

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


// Add Last and route will not implement
exports.viewMoment = async (req, res) => {
    try {
        const viewerId = req.user.userId;
        const { userId } = req.params; // ID of the moment's owner

        if (!userId) {
            return res.status(200).json({
                success: false,
                message: "Moment owner ID is required"
            });
        }

        const moments = await Moment.find({ userId });

        if (!moments.length) {
            return res.status(200).json({
                success: false,
                message: "No moments found for this user"
            });
        }

        // Add viewer only if not the owner
        if (viewerId !== userId) {
            for (let moment of moments) {
                if (!moment.viewers.includes(viewerId)) {
                    moment.viewers.push(viewerId);
                    await moment.save();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Fetched user's moments",
            moments,
        });

    } catch (error) {
        console.error("Error in viewMoment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error in viewMoment",
        });
    }
};




exports.viewAllMoments = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get current user's friends
        const user = await User.findById(userId).populate('userAllFriends', '_id');
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found"
            });
        }

        const friendIds = user.userAllFriends.map(friend => friend._id);

        // Fetch only friends' moments
        const allMoments = await Moment.find({ user: { $in: friendIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'userName profilePic');

        return res.status(200).json({
            success: true,
            allMoments,
        });

    } catch (error) {
        console.log("Error in viewAllMoments:", error);
        return res.status(500).json({
            success: false,
            message: "Error in viewAllMoments controller"
        });
    }
};




