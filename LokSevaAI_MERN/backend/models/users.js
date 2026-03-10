const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user_id: String,
  full_name: String,
  phone: String,
  profession: String,
  income_bracket: Number,
  email : String,
  domicile: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("users", ProfileSchema);