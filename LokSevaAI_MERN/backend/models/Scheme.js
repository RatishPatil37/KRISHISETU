const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  scheme_name: { type: String, required: true },
  category: { type: String, default: "General" },
  state: { type: String, default: 'All India' },
  income_level: { type: String, default: 'All' },
  eligibility_criteria: { type: String, default: "Not specified" },
  benefits: { type: String, default: "Not specified" },
  application_link: { type: String, default: "#" },
  summary: { type: String, default: "" },
  required_documents: { type: String, default: 'Aadhar Card, Income Certificate, Domicile' },
  start_date: { type: String, default: 'January 1st, 2026' },
  end_date: { type: String, default: 'December 31st, 2026' },
  eligibility_score: { type: Number, default: 75 },
  embeddings: [Number], // For vector search, if needed
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);