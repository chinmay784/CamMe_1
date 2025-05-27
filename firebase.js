const admin = require("firebase-admin");
const serviceAccount = require('./push-3292b-firebase-adminsdk-fbsvc-b38daed7f0.json'); // Adjust path as needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
