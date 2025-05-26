const admin = require("firebase-admin");
const serviceAccount = require("./console.json"); // Adjust path as needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;