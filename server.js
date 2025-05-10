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


global.io = io;
global.onlineUsers = new Map();


io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("User_Connected", (userId) => {
        global.onlineUsers.set(userId, socket.id);
        console.log("Online Users:", global.onlineUsers);
    });

    socket.on("disconnect", () => {
        for (let [userId, socketId] of global.onlineUsers.entries()) {
            if (socketId === socket.id) {
                global.onlineUsers.delete(userId);
                break;
            }
        }
        console.log("User disconnected:", socket.id);
    });
});


app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
swaggerSetup(app);

dbConnect();


app.use("/api/v1/user", authRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to the Chat Application API");
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
  
              const res = await fetch('/api/auth/reset-direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
              });
  
              const data = await res.json();
              if (data.success) {
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
