const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require("./routes/userAuthRoutes");
const { dbConnect } = require('./dataBase/db');
const mongoose = require('mongoose');
const swaggerSetup = require('./swagger');
const Message = require("./models/messageModel")

const app = express();
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New user connected:", socket.id);

  // Handle user joining
  socket.on("join", (userId) => {
    users.set(userId, socket.id);
    console.log("✅ User joined:", userId);
  });

  // Handle sending messages
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    const newMessage = await Message.create({ senderId, receiverId, message });

    // Emit to sender
    socket.emit("messageSent", newMessage);

    // Emit to receiver if online
    const receiverSocket = users.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("newMessage", newMessage);
    }
  });

  // Handle typing indicator
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = users.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { from: senderId });
    }
  });

  // Message read (seen) event
  socket.on("markAsRead", async ({ messageId }) => {
    await Message.findByIdAndUpdate(messageId, { isRead: true });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        break;
      }
    }
    console.log("❌ User disconnected:", socket.id);
  });
});


app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
swaggerSetup(app);

dbConnect();


app.use("/api/v1/user", authRoutes);
require("./timerService");

app.get("/", (req, res) => {
  res.send("Welcome to the Cam Me Application API Documentation");
}
);


// in server.js or app.js
app.get('/reset-window', (req, res) => {
  const email = req.query.email;

  res.send(`
      <html>
        <head><title>Reset Password</title></head>
        <body>
          <h2>Reset Your Password</h2>
          <form id="resetForm">
            <input type="hidden" id="email" value="${email}" />
            <label>OTP:</label>
            <input type="text" id="otp" required /><br/><br/>
            <label>New Password:</label>
            <input type="password" id="newPassword" required /><br/><br/>
            <button type="submit">Save</button>
          </form>
  
          <script>
            document.getElementById('resetForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const email = document.getElementById('email').value;
              const otp = document.getElementById('otp').value;
              const newPassword = document.getElementById('newPassword').value;
  
              const res = await fetch('/api/v1/user/reset-password',{
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
              });
  
              const data = await res.json();
              if (data.sucess) {
                alert("Password reset successful!");
                window.close();
              } else {
                alert(data.message || "Reset failed");
              }
            });
          </script>
        </body>
      </html>
    `);
});


server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Api Docs avaliable  at http://localhost:${PORT}/api-docs`);
});
