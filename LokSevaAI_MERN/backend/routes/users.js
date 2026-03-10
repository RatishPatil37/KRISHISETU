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
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update user profile
router.post('/profile', async (req, res) => {
  try {
    const { email, name, phone, age, state, incomeClass, language } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.age = age || user.age;
      user.state = state || user.state;
      user.incomeClass = incomeClass || user.incomeClass;
      user.language = language || user.language;
    } else {
      user = new User({ email, name, phone, age, state, incomeClass, language });
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
    const { name, phone, age, state, incomeClass, language } = req.body;

    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { name, phone, age, state, incomeClass, language },
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

// ── Upsert from data-collection module (Vite frontend) ────
// POST /api/users/upsert
// Matches by Supabase UID so re-submits don't create duplicates.
router.post('/upsert', async (req, res) => {
  try {
    const { uid, full_name, phone, profession, income_bracket, domicile } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'uid is required' });
    }

    const update = { user_id: uid, full_name, phone, profession, income_bracket, domicile };

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