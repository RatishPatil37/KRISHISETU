const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  scheme_name: { type: String, required: true },
  category: { type: String, required: true },
  state: { type: String, default: 'All India' },
  income_level: { type: String, default: 'All' },
  eligibility_criteria: { type: String, required: true },
  benefits: { type: String, required: true },
  application_link: { type: String, required: true },
  summary: { type: String, required: true },
  embeddings: [Number], // For vector search, if needed
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);