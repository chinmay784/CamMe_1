const dotenv = require('dotenv');
dotenv.config();
const admin = require("firebase-admin");
const serviceAccount = require("./console.json"); // Download from Firebase Console
const {applicationDefault} = require("firebase-admin/app")

process.env.GOOGLE_APPLICATION_CREDENTIALS;

admin.initializeApp({
  credential: applicationDefault(),
  projectId:"potion-for-creators"
});

module.exports = admin;