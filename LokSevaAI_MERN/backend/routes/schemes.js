const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get all schemes
router.get('/', async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search schemes
router.get('/search', async (req, res) => {
  const { query, category, state } = req.query;
  try {
    let filter = {};
    if (category) filter.category = category;
    if (state) filter.state = state;
    if (query) {
      filter.$or = [
        { scheme_name: { $regex: query, $options: 'i' } },
        { summary: { $regex: query, $options: 'i' } },
        { eligibility_criteria: { $regex: query, $options: 'i' } }
      ];
    }
    const schemes = await Scheme.find(filter);
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add scheme manually
router.post('/', async (req, res) => {
  const scheme = new Scheme(req.body);
  try {
    const savedScheme = await scheme.save();
    res.status(201).json(savedScheme);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ingest schemes from india.gov.in (simplified)
router.post('/ingest', async (req, res) => {
  try {
    // Scrape india.gov.in (simplified example)
    const response = await axios.get('https://www.india.gov.in/my-government/schemes');
    const $ = cheerio.load(response.data);
    
    // Extract scheme links (this is a placeholder, actual scraping would be more complex)
    const schemeLinks = [];
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('/schemes/')) {
        schemeLinks.push(href);
      }
    });

    // For each link, scrape and structure with Gemini
    for (const link of schemeLinks.slice(0, 5)) { // Limit for demo
      try {
        const pageResponse = await axios.get(link);
        const page$ = cheerio.load(pageResponse.data);
        const markdown = page$('body').text(); // Simplified

        // Use Gemini to structure
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Extract government scheme information from this text and return JSON: ${markdown}`;
        const result = await model.generateContent(prompt);
        const structuredData = JSON.parse(result.response.text());

        // Save to DB
        const scheme = new Scheme(structuredData);
        await scheme.save();
      } catch (e) {
        console.error('Error processing scheme:', e);
      }
    }

    res.json({ message: 'Ingestion completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;