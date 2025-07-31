import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import http from 'http';
import { Server } from 'socket.io';
import SocketHandler from './SocketHandler.js';
import { Application, Chat, Freelancer, Project, User } from './Schema.js';

const app = express();
const PORT = 6001;


// === Middleware ===
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// === Server + Socket Setup ===
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on("connection", (socket) => {
  console.log("🟢 User connected to Socket.io");
  SocketHandler(socket);
});

// === MongoDB Atlas URI ===
const MONGO_URI = 'mongodb+srv://shivanibhandwalkar:asnKb2CKInN434mC@cluster0.vhulry4.mongodb.net/?tls=true';

// === ROUTES ===

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: passwordHash, usertype });
    const user = await newUser.save();

    if (usertype === 'freelancer') {
      const newFreelancer = new Freelancer({ userId: user._id });
      await newFreelancer.save();
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example: Fetch all users
app.get('/fetch-users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// You can continue adding your other routes here...
// E.g., /fetch-projects, /new-project, /make-bid, etc.

// === MongoDB Connection and Server Start ===
mongoose.connect('mongodb+srv://shivanibhandwalkar:asnKb2CKInN434mC@cluster0.vhulry4.mongodb.net/?tls=true', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ Connected to MongoDB Atlas");

  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}).catch((e) => {
  console.error("❌ MongoDB connection failed:", e.message);
});
