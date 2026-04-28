const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Scheme = require('../models/Scheme');
const { sendSchemeWhatsApp } = require('../services/twilioService');

router.post('/send-schemes', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    // Lookup user in DB to grab their phone number
    const userProfile = await User.findOne({ user_id: uid });
    if (!userProfile || !userProfile.phone) {
      return res.status(404).json({ success: false, error: "User profile or phone number not found. Please update your profile first." });
    }

    // Fetch the latest 5 active farmer schemes
    const allSchemes = await Scheme.find().limit(5);

    if (allSchemes.length === 0) {
      return res.status(404).json({ success: false, error: "No schemes currently available in the database." });
    }

    // Call the Twilio Service to send the WhatsApp
    await sendSchemeWhatsApp(userProfile, allSchemes);

    return res.json({ success: true, message: "Schemes successfully sent to WhatsApp!" });

  } catch (error) {
    console.error("Error in WhatsApp route:", error);
    return res.status(500).json({ success: false, error: "Failed to send WhatsApp message", details: error.message });
  }
});

module.exports = router;
