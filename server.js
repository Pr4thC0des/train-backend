require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    password: { type: String, required: true } 
});

const ScorecardSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    inspectionDate: { type: Date, required: true },
    scores: { type: Map, of: [Number] },
    remarks: { type: Map, of: String },
    submittedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Scorecard = mongoose.model('Scorecard', ScorecardSchema);

// --- ROUTES ---

// 1. REGISTER USER (Run this once to create your admin)
app.post('/api/register', async (req, res) => {
    try {
        const { employeeId, password } = req.body;
        // Check if user exists
        const existing = await User.findOne({ employeeId });
        if (existing) return res.status(400).json({ success: false, message: "User already exists" });

        // Create new user
        const newUser = new User({ employeeId, password });
        await newUser.save();
        
        console.log("👤 New User Registered:", employeeId);
        res.json({ success: true, message: "User created successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error registering user" });
    }
});

// 2. LOGIN USER (Used by App)
app.post('/api/login', async (req, res) => {
    const { employeeId, password } = req.body;
    try {
        const user = await User.findOne({ employeeId });
        
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid ID or Password" });
        }
        
        console.log("🔓 Login Success:", employeeId);
        res.json({ success: true, message: "Login Successful", user: user.employeeId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 3. SUBMIT SCORECARD
app.post('/submit', async (req, res) => {
    try {
        const newEntry = new Scorecard(req.body);
        await newEntry.save();
        console.log("📝 Report Saved:", req.body.stationName);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Save Failed" });
    }
});

// 4. GET HISTORY
app.get('/api/scorecards', async (req, res) => {
    try {
        const history = await Scorecard.find().sort({ submittedAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Fetch Failed" });
    }
});

// 5. SERVE WEBSITE
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));