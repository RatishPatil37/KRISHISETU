const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  summary: {
    type: String,
    default: ""
  },
  link: {
    type: String
  },
  image_url: {
    type: String
  },
  source: {
    type: String,
    default: "Agricultural Feed"
  },
  priority: {
    type: Number,
    default: 0
  },
  published_date: {
    type: String // We will try to parse this later, string is safer for scrapers
  },
  fetched_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("News", NewsSchema);
