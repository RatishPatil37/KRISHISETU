const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  scheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Scheme"
  },

  message: String,

  sent: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("notifications", NotificationSchema);