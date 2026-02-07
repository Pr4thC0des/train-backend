const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// 1. Root Route (To check if server is running)
app.get('/', (req, res) => {
    res.send('✅ Train Scorecard Server is Running!');
});

// 2. Submission Route (This replaces webhook.site)
app.post('/submit', (req, res) => {
    const data = req.body;

    console.log("------------------------------------------");
    console.log("🚂 NEW INSPECTION RECEIVED");
    console.log("Station:", data.stationName);
    console.log("Date:", data.inspectionDate);
    console.log("Scores:", JSON.stringify(data.scores));
    console.log("------------------------------------------");

    // In a real database app, you would save 'data' to MongoDB here.
    
    // Send success response back to Flutter
    res.status(200).json({ 
        success: true, 
        message: "Scorecard saved successfully on the server." 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
});