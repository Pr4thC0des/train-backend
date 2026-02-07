require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' folder (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION ---
// Connect to MongoDB using the URI from your .env file
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define the Schema (Structure of your data)
const ScorecardSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    inspectionDate: { type: Date, required: true },
    scores: { type: Map, of: [Number] }, // Allows dynamic keys like "Toilet Cleanliness"
    remarks: { type: Map, of: String },
    submittedAt: { type: Date, default: Date.now }
});

const Scorecard = mongoose.model('Scorecard', ScorecardSchema);

// --- ROUTES ---

// 1. Submit Data (App -> Server)
app.post('/submit', async (req, res) => {
    try {
        console.log("🚂 Receiving submission for:", req.body.stationName);
        
        // Create new entry in database
        const newEntry = new Scorecard(req.body);
        await newEntry.save();
        
        console.log("✅ Saved to MongoDB!");
        res.status(201).json({ success: true, message: "Scorecard saved successfully." });
    } catch (error) {
        console.error("❌ Save Error:", error);
        res.status(500).json({ success: false, message: "Server Error: Could not save data." });
    }
});

// 2. Get Data (Server -> Website Dashboard)
app.get('/api/scorecards', async (req, res) => {
    try {
        // Fetch all records, sorted by newest first
        const history = await Scorecard.find().sort({ submittedAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch data" });
    }
});

// 3. Serve the Website (For any other route, show index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});