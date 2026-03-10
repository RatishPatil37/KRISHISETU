const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Essential for MERN
require('dotenv').config();

const app = express();

// 1. MIDDLEWARE
app.use(cors()); // Allows your React app (port 3000) to talk to this server (port 5000)
app.use(express.json());

// 2. MONGODB SCHEMA & MODEL
const CallLogSchema = new mongoose.Schema({
  callId: { type: String, required: true },
  transcript: String,
  summary: String,
  fraudDetected: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const CallLog = mongoose.model('CallLog', CallLogSchema);

// 3. ROUTES

// Test Route: Check if backend is alive
app.get('/', (req, res) => {
  res.send('LokSeva Backend is Running and Healthy!');
});

// GET Route: View all logs (Useful for your frontend dashboard later)
app.get('/logs', async (req, res) => {
  try {
    const logs = await CallLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch logs" });
  }
});

// POST Route: Webhook Endpoint for Vapi
app.post('/vapi-webhook', async (req, res) => {
  try {
    const { message } = req.body;

    // Vapi sends 'end-of-call-report' when the call finishes
    if (message && message.type === 'end-of-call-report') {
      console.log(`Processing End of Call Report for: ${message.callId}`);

      const newLog = new CallLog({
        callId: message.callId,
        transcript: message.artifact?.transcript || "No transcript available",
        summary: message.analysis?.summary || "No summary available",
        // Detection logic: searches for specific keywords in the AI's summary
        fraudDetected: 
          message.analysis?.summary?.toLowerCase().includes('fraud') || 
          message.analysis?.summary?.toLowerCase().includes('suspicious') ||
          message.analysis?.summary?.toLowerCase().includes('agent')
      });

      await newLog.save();
      console.log("✅ Call log successfully saved to MongoDB");
    }

    // Always send a 200 OK back to Vapi immediately
    res.status(200).send('Webhook Received');

  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).send('Internal Server Error');
  }
});

// 4. DATABASE CONNECTION & SERVER START
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("-----------------------------------------");
    console.log("✅ Connected to LokSeva Database (MongoDB)");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    console.log("-----------------------------------------");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    console.log("Check if your IP is whitelisted in MongoDB Atlas and your .env is correct.");
  });