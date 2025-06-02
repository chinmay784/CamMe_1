const User = require("./models/userModel");

setInterval(async () => {
    const users = await User.find({ loginStartTime: { $ne: null }, hasExceededLimit: false });

    const now = new Date();

    for (const user of users) {
        const elapsedSeconds = Math.floor((now - user.loginStartTime) / 1000);

        user.totalSessionTime = elapsedSeconds;

        if (elapsedSeconds > 9300) { // 2h 35m
            console.log(`⚠️ User ${user._id} exceeded time limit (2h 35m).`);

            if(user.posts.length >= 10){
                user.points = (user.points || 0) + 25;
                await user.save();
                console.log(`✅ User ${user._id} awarded 25 points for having 10 posts.`);
            }

            if(user.posts.length <= 10){
                user.points = (user.points || 0) + 25;
                await user.save();
                console.log(`✅ User ${user._id} awarded 25 points for having 10 posts.`);
            }

            const creditsEarned = Math.floor(user.points / 500) ;
            if(creditsEarned > 0) {
                user.freeCredit = (user.freeCredit || 0) + creditsEarned;
                // user.points -= creditsEarned * 500; // Deduct points used for credits
                console.log(`✅ User ${user._id} earned ${creditsEarned} free credits.`);
                await user.save();
            }

            // Optionally notify the user or take action
           // user.hasExceededLimit = true;
        }

        await user.save();
    }
}, 60 * 1000); // Runs every 1 minute