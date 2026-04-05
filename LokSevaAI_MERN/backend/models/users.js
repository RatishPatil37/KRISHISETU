const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user_id: String,
  full_name: String,
  phone: String,
  profession: String,
  income_bracket: Number,
  email: String,
  domicile: String,
  district: String,
  taluka: String,
  village: String,
  survey_number: String,
  land_area: String,
  income_category: String, // Backward Class, Middle Class, Higher Class
  name: String,
  age: Number,
  state: String,
  incomeClass: String,
  language: String,
  location: String,
  income_value: Number,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("users", ProfileSchema);