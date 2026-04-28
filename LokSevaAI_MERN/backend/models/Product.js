const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Crops', 'Seeds', 'Tools', 'Livestock', 'Fertilizers']
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    default: 'kg'
  },
  quantity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  farmer_name: {
    type: String,
    required: true
  },
  farmer_phone: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    default: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=400'
  },
  user_id: {
    type: String, // String to match Supabase UID
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
