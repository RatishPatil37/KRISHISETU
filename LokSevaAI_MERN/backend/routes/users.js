const express = require('express');
const router = express.Router();
const User = require('../models/users');

// Get user profile by email
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user }); // Wrap in success for consistency
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user profile by UID
router.get('/profile', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ success: false, message: 'uid is required' });
    }
    const user = await User.findOne({ user_id: uid });
    // Return null user instead of 404 so frontend handles it gracefully
    res.json({ success: true, user: user || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update user profile
router.post('/profile', async (req, res) => {
  try {
    const { uid, email, name, phone, age, state, incomeClass, language, district, taluka, location, income_value } = req.body;

    let user = null;
    if (uid) user = await User.findOne({ user_id: uid });
    if (!user && email) user = await User.findOne({ email });
    if (!user && phone) user = await User.findOne({ phone });

    if (user) {
      if (uid) user.user_id = uid;
      if (email && !user.email) user.email = email;
      user.name = name ?? user.name;
      user.phone = phone ?? user.phone;
      user.age = age ?? user.age;
      user.state = state ?? user.state;
      user.incomeClass = incomeClass ?? user.incomeClass;
      user.language = language ?? user.language;
      user.district = district ?? user.district;
      user.taluka = taluka ?? user.taluka;
      user.location = location ?? user.location;
      user.income_value = income_value ?? user.income_value;
    } else {
      user = new User({ user_id: uid, email, name, phone, age, state, incomeClass, language, district, taluka, location, income_value });
    }

    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile/:email', async (req, res) => {
  try {
    const { name, phone, age, state, incomeClass, language, district, taluka, location, income_value } = req.body;

    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { name, phone, age, state, incomeClass, language, district, taluka, location, income_value },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Check if user exists by email (used by data-collection app) ──
// GET /api/users/check-email?email=xxx
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Upsert from data-collection module (Vite frontend) ────
// POST /api/users/upsert
// Matches by Supabase UID so re-submits don't create duplicates.
router.post('/upsert', async (req, res) => {
  try {
    const { uid, email, full_name, phone, profession, income_bracket, domicile } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'uid is required' });
    }

    function calculateIncomeCategory(income) {
      if (!income && income !== 0) return undefined;
      const inc = Number(income);
      if (inc < 150000) return "Backward Class";
      if (inc < 800000) return "Middle Class";
      return "Higher Class";
    }

    const update = {
      user_id: uid,
      email: email ? email.toLowerCase() : undefined,
      full_name,
      phone,
      profession,
      income_bracket,
      income_category: calculateIncomeCategory(income_bracket),
      domicile
    };

    // Remove undefined fields so we don't overwrite existing data with undefined
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

    const user = await User.findOneAndUpdate(
      { user_id: uid },           // match by Supabase UID
      { $set: update },
      { new: true, upsert: true } // create if not found
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;