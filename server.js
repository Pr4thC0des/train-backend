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
    .then(() => {
        console.log("✅ Connected to MongoDB");
        createDefaultUser(); // Auto-create admin user on startup
    })
    .catch((err) => console.error("❌ MongoDB Error:", err));

// --- SCHEMAS ---
const ScorecardSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    inspectionDate: { type: Date, required: true },
    scores: { type: Map, of: [Number] },
    remarks: { type: Map, of: String },
    submittedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    password: { type: String, required: true } // In production, hash this!
});

const Scorecard = mongoose.model('Scorecard', ScorecardSchema);
const User = mongoose.model('User', UserSchema);

// --- HELPER: Create Default Admin ---
async function createDefaultUser() {
    const existing = await User.findOne({ employeeId: 'admin' });
    if (!existing) {
        await new User({ employeeId: 'admin', password: 'password123' }).save();
        console.log("🔒 Default User Created: ID=admin, Pass=password123");
    }
}

// --- ROUTES ---

// 1. LOGIN ROUTE (New)
app.post('/api/login', async (req, res) => {
    const { employeeId, password } = req.body;
    try {
        const user = await User.findOne({ employeeId });
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid ID or Password" });
        }
        res.json({ success: true, message: "Login Successful", user: user.employeeId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 2. Submit Scorecard
app.post('/submit', async (req, res) => {
    try {
        const newEntry = new Scorecard(req.body);
        await newEntry.save();
        console.log("✅ Saved Report for:", req.body.stationName);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Save Failed" });
    }
});

// 3. Get Scorecards
app.get('/api/scorecards', async (req, res) => {
    try {
        const history = await Scorecard.find().sort({ submittedAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Fetch Failed" });
    }
});

// 4. Serve Website
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));