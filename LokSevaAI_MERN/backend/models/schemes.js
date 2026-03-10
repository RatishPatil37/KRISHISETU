const mongoose = require("mongoose");

const SchemeSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  description: String,

  state: String,

  eligibleClass: {
    type: String,
    enum: ["BPL", "LIG", "MIG", "HIG"]
  },

  benefits: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("schemes", SchemeSchema);