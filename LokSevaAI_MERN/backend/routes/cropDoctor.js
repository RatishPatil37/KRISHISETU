const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Expert Disease Treatment Database (30+ common crop diseases)
// Used as fallback when Kindwise API doesn't return treatment data
// ─────────────────────────────────────────────────────────────────────────────
const DISEASE_TREATMENTS = {
  // ── Fungal Diseases ──
  'stem rust': {
    biological: [
      'Apply Trichoderma harzianum biocontrol agent around the plant base at 5g/litre water.',
      'Use neem oil spray (5ml/litre) every 7 days to suppress fungal spore germination.',
      'Spray Pseudomonas fluorescens solution (10g/litre) as a biological fungicide.',
      'Apply garlic extract (50ml/litre) to create a hostile environment for rust fungi.',
    ],
    chemical: [
      'Spray Tebuconazole 250 EC at 1ml/litre water; apply at first sign of infection.',
      'Apply Propiconazole 25 EC at 1ml/litre water every 14 days during infection period.',
      'Use Mancozeb 75 WP at 2.5g/litre water as a protective fungicide spray.',
    ]
  },
  'leaf rust': {
    biological: [
      'Apply Trichoderma viride at 5g/litre water as soil drenching and foliar spray.',
      'Use neem-based biopesticide (Azadirachtin 0.03%) at 3ml/litre water weekly.',
      'Spray Bacillus subtilis solution to suppress rust fungus development.',
      'Apply wood ash solution (100g/litre water, filtered) to leaves as a protective coat.',
    ],
    chemical: [
      'Apply Hexaconazole 5 EC at 2ml/litre water at 10-14 day intervals.',
      'Spray Triadimefon 25 WP at 1g/litre water from booting to heading stage.',
      'Use Cyproconazole 10 WP at 0.75ml/litre water for systemic protection.',
    ]
  },
  'early blight': {
    biological: [
      'Apply copper-based organic spray (copper sulfate 3g + lime 3g per litre) weekly.',
      'Use neem oil (5ml/litre) + soap solution spray every 5-7 days.',
      'Spray Bacillus subtilis (1g/litre) as organic fungal suppressant.',
      'Apply compost tea spray to boost plant immunity against fungal pathogens.',
    ],
    chemical: [
      'Apply Mancozeb 75 WP at 2g/litre water every 7-10 days as protective spray.',
      'Spray Chlorothalonil 75 WP at 2g/litre water — do not apply within 14 days of harvest.',
      'Use Iprodione 50 WP at 2g/litre for curative treatment after infection appears.',
    ]
  },
  'late blight': {
    biological: [
      'Apply copper hydroxide 77 WP (organic-approved) at 3g/litre water preventively.',
      'Use Bacillus amyloliquefaciens spray as biological control every 7 days.',
      'Spray diluted neem oil (5ml/litre) + potassium bicarbonate (5g/litre) solution.',
      'Remove and destroy infected leaves immediately to prevent spread.',
    ],
    chemical: [
      'Apply Metalaxyl + Mancozeb (Ridomil Gold) at 2.5g/litre water at first symptom.',
      'Spray Cymoxanil + Famoxadone at 0.5g/litre water every 7-10 days.',
      'Use Dimethomorph 50 WP at 1g/litre water for systemic curative action.',
    ]
  },
  'powdery mildew': {
    biological: [
      'Spray baking soda solution (5g sodium bicarbonate + 2ml liquid soap per litre) weekly.',
      'Apply diluted milk spray (1:9 milk to water ratio) every 5 days — proven effective.',
      'Use neem oil spray (5ml/litre) on both leaf surfaces at weekly intervals.',
      'Apply potassium bicarbonate (5g/litre) to raise leaf surface pH and inhibit fungi.',
    ],
    chemical: [
      'Apply Sulfur 80 WG at 2-3g/litre water — highly effective against powdery mildew.',
      'Spray Hexaconazole 5 SC at 2ml/litre water as systemic fungicide.',
      'Use Myclobutanil 10 WP at 1g/litre water every 10 days during disease pressure.',
    ]
  },
  'downy mildew': {
    biological: [
      'Apply Copper oxychloride 50 WP at 3g/litre water as organic-approved spray.',
      'Use Pseudomonas fluorescens (10g/litre) as biocontrol foliar spray.',
      'Spray Trichoderma asperellum solution to suppress oomycete pathogen.',
      'Ensure good air circulation and reduce leaf wetness to limit disease spread.',
    ],
    chemical: [
      'Apply Metalaxyl-M + Mancozeb at 2.5g/litre water preventively.',
      'Spray Fosetyl-aluminium 80 WP at 2.5g/litre water at 10-day intervals.',
      'Use Iprovalicarb + Propineb at 2g/litre water for curative action.',
    ]
  },
  'fusarium wilt': {
    biological: [
      'Drench soil with Trichoderma harzianum (5g/litre water) around plant roots.',
      'Apply Pseudomonas fluorescens as seed treatment and soil application.',
      'Use Bacillus subtilis soil drench to suppress Fusarium population.',
      'Add well-composted organic matter to soil to increase beneficial microorganism activity.',
    ],
    chemical: [
      'Drench soil with Carbendazim 50 WP (1g/litre water) around plant base.',
      'Apply Thiophanate-methyl 70 WP at 1g/litre water as root zone drench.',
      'Use Flusilazole 40 EC at 0.5ml/litre water as systemic fungicide treatment.',
    ]
  },
  'anthracnose': {
    biological: [
      'Spray copper-based fungicide (copper hydroxide 3g/litre) as preventive treatment.',
      'Apply neem oil extract (5ml/litre) + garlic juice (10ml/litre) spray weekly.',
      'Use Bacillus subtilis biofungicide spray at early disease signs.',
      'Remove and destroy infected fruits/leaves to reduce inoculum.',
    ],
    chemical: [
      'Apply Thiophanate-methyl 70 WP at 1.5g/litre water every 10-14 days.',
      'Spray Azoxystrobin 23 SC at 1ml/litre water as systemic protectant.',
      'Use Prochloraz 45 EC at 1ml/litre water for post-harvest treatment and field use.',
    ]
  },
  'bacterial leaf blight': {
    biological: [
      'Spray copper oxychloride 50 WP (3g/litre) as bactericide — organic approved.',
      'Apply Pseudomonas fluorescens (10g/litre water) foliar spray every 10 days.',
      'Use Streptomyces lydicus biobactericide as foliar treatment.',
      'Maintain field hygiene — remove infected crop debris and avoid waterlogging.',
    ],
    chemical: [
      'Apply Copper hydroxide 77 WP at 3g/litre water as bactericidal spray.',
      'Spray Streptomycin sulfate 90% SP at 0.5g/litre water at infection onset.',
      'Use Kasugamycin 2% SL at 2ml/litre water for systemic bacterial control.',
    ]
  },
  'mosaic virus': {
    biological: [
      'Control aphid and whitefly vectors using neem oil spray (5ml/litre) weekly.',
      'Apply reflective mulch to repel vector insects that transmit virus.',
      'Remove and destroy infected plants immediately to prevent virus spread.',
      'Introduce beneficial predators (ladybugs, lacewings) to control aphid populations.',
    ],
    chemical: [
      'Apply Imidacloprid 17.8 SL (0.5ml/litre) to control aphid and whitefly vectors.',
      'Spray Thiamethoxam 25 WG at 0.4g/litre water for systemic insect vector control.',
      'Use Dimethoate 30 EC at 2ml/litre water to suppress sap-sucking insect vectors.',
    ]
  },
  'leaf spot': {
    biological: [
      'Apply neem oil (5ml/litre) + liquid soap (2ml/litre) spray every 7 days.',
      'Spray copper sulfate + lime mixture (Bordeaux mixture, 1%) as protective spray.',
      'Use Bacillus subtilis biofungicide foliar spray at 10-day intervals.',
      'Apply compost tea to enhance plant immunity and suppress fungal pathogens.',
    ],
    chemical: [
      'Spray Mancozeb 75 WP at 2.5g/litre water every 7-10 days preventively.',
      'Apply Propiconazole 25 EC at 1ml/litre water for systemic curative action.',
      'Use Chlorothalonil 75 WP at 2g/litre water as broad-spectrum fungicide.',
    ]
  },
  'root rot': {
    biological: [
      'Drench soil with Trichoderma harzianum (5g/litre) for biocontrol.',
      'Apply Bacillus subtilis soil amendment to suppress Pythium and Phytophthora.',
      'Improve soil drainage to prevent waterlogging which promotes root rot.',
      'Use disease-free certified seeds and practice crop rotation.',
    ],
    chemical: [
      'Drench soil with Metalaxyl-M 4% GR at 10g/square meter around root zone.',
      'Apply Carbendazim + Mancozeb combination at 2g/litre as root drench.',
      'Use Fosetyl-Al 80 WP at 3g/litre water for Phytophthora root rot control.',
    ]
  },
  'blight': {
    biological: [
      'Apply copper-based spray (Bordeaux mixture 1%) every 7-10 days preventively.',
      'Use neem oil (5ml/litre) + soap solution as organic protective spray.',
      'Spray Bacillus subtilis or Trichoderma-based bio-fungicide weekly.',
      'Remove infected leaves promptly and avoid overhead irrigation.',
    ],
    chemical: [
      'Apply Metalaxyl + Mancozeb (2.5g/litre) at first appearance of symptoms.',
      'Spray Mancozeb 75 WP (2g/litre) as protective fungicide every 7 days.',
      'Use Azoxystrobin 23 SC (1ml/litre) for broad-spectrum systemic protection.',
    ]
  },
  'whitefly': {
    biological: [
      'Release Encarsia formosa parasitic wasp for biological control of whitefly nymphs.',
      'Apply neem oil (5ml/litre) + soap spray on undersides of leaves weekly.',
      'Use yellow sticky traps to monitor and reduce adult whitefly populations.',
      'Spray insecticidal soap (5ml/litre) targeting leaf undersides every 5 days.',
    ],
    chemical: [
      'Apply Imidacloprid 17.8 SL at 0.5ml/litre water as systemic insecticide.',
      'Spray Spiromesifen 22.9 SC at 1ml/litre water to target nymphs and eggs.',
      'Use Acetamiprid 20 SP at 0.5g/litre water at 10-14 day intervals.',
    ]
  },
  'aphid': {
    biological: [
      'Introduce ladybird beetles (Coccinella spp.) as natural predators of aphids.',
      'Apply neem oil spray (5ml/litre) on colony spots — targets all life stages.',
      'Use insecticidal soap spray (5ml/litre) directly on aphid colonies.',
      'Spray garlic extract (50ml/litre) as a natural repellent every 5 days.',
    ],
    chemical: [
      'Apply Dimethoate 30 EC at 2ml/litre water for quick knockdown of aphids.',
      'Spray Chlorpyrifos 20 EC at 2ml/litre water targeting all plant surfaces.',
      'Use Thiamethoxam 25 WG at 0.4g/litre water as systemic protection.',
    ]
  },
  'default': {
    biological: [
      'Apply neem oil (Azadirachtin 0.03%) at 3-5ml/litre water spray every 7-10 days.',
      'Use Trichoderma harzianum biocontrol agent at 5g/litre water as soil drench and foliar spray.',
      'Spray Bacillus subtilis-based bio-fungicide/bio-bactericide at 10-day intervals.',
      'Apply Bordeaux mixture (1%) as broad-spectrum copper-based organic protectant.',
    ],
    chemical: [
      'Apply Mancozeb 75 WP at 2-2.5g/litre water as broad-spectrum protective fungicide.',
      'Spray Propiconazole 25 EC at 1ml/litre water as systemic curative treatment.',
      'Use Carbendazim 50 WP at 1g/litre water for systemic fungal/bacterial control.',
    ]
  }
};

/**
 * Find matching treatment from built-in database using fuzzy keyword matching.
 * @param {string} diseaseName - Disease name from Kindwise API
 */
function getTreatmentFromDatabase(diseaseName) {
  if (!diseaseName) return DISEASE_TREATMENTS['default'];
  const lower = diseaseName.toLowerCase();
  // Exact or partial key match
  for (const key of Object.keys(DISEASE_TREATMENTS)) {
    if (key === 'default') continue;
    if (lower.includes(key) || key.split(' ').every(word => lower.includes(word))) {
      return DISEASE_TREATMENTS[key];
    }
  }
  return DISEASE_TREATMENTS['default'];
}

/**
 * Fill missing biological/chemical treatment using expert database,
 * then try Gemini as secondary fallback if key available.
 */
async function fillMissingTreatments(parsed) {
  const needsBio  = !parsed.biological || parsed.biological.length === 0;
  const needsChem = !parsed.chemical   || parsed.chemical.length   === 0;
  if (!needsBio && !needsChem) return parsed;

  // Step 1: Try built-in expert database (instant, no API call)
  const dbEntry = getTreatmentFromDatabase(parsed.diseaseName);
  if (needsBio  && dbEntry.biological) parsed.biological = dbEntry.biological;
  if (needsChem && dbEntry.chemical)   parsed.chemical   = dbEntry.chemical;
  console.log('[CropDoctor] Filled from expert database for:', parsed.diseaseName);

  // Step 2: If still missing (shouldn't happen), try Gemini as last resort
  const stillNeedsBio  = !parsed.biological || parsed.biological.length === 0;
  const stillNeedsChem = !parsed.chemical   || parsed.chemical.length   === 0;
  if (!stillNeedsBio && !stillNeedsChem) return parsed;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.includes('YOUR_')) return parsed;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Provide biological and chemical treatments for ${parsed.diseaseName} on ${parsed.cropName}. Return ONLY JSON: {"biological": ["...","...","..."], "chemical": ["...","...","..."]}`;
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const data = JSON.parse(text);
    if (stillNeedsBio  && Array.isArray(data.biological)) parsed.biological = data.biological;
    if (stillNeedsChem && Array.isArray(data.chemical))   parsed.chemical   = data.chemical;
  } catch (e) {
    console.warn('[CropDoctor] Gemini fallback also failed:', e.message);
  }

  return parsed;
}

// Multer: Store in memory for Base64 conversion
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Call Kindwise Crop Health API
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithKindwise(base64Image, mimeType) {
  const apiKey = process.env.KINDWISE_API_KEY;
  if (!apiKey) throw new Error('KINDWISE_API_KEY is not set in .env');

  const imageData = `data:${mimeType};base64,${base64Image}`;

  const response = await axios.post(
    'https://crop.kindwise.com/api/v1/identification',
    {
      images: [imageData]
    },
    {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      // Kindwise requires health/details as query string params, NOT in the body
      params: {
        health: 'all',
        details: 'treatment,common_names,description,cause',
        disease_details: 'treatment,classification,common_names,description'
      },
      timeout: 30000
    }
  );

  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Parse Kindwise API response into a clean report object
// ─────────────────────────────────────────────────────────────────────────────
function parseKindwiseResult(data) {
  const result = data.result || {};

  // --- Crop / Plant ID ---
  const cropSuggestion = result.crop?.suggestions?.[0] || {};
  const cropName = cropSuggestion.name || 'Unknown Crop';
  const cropConfidence = Math.round((cropSuggestion.probability || 0) * 100);
  const commonNames = cropSuggestion.details?.common_names || [];

  // --- Health Status ---
  const isHealthy = result.is_healthy?.binary ?? null;
  const healthProbability = Math.round((result.is_healthy?.probability || 0) * 100);

  // --- Disease / Pest ---
  const diseaseSuggestions = result.disease?.suggestions || [];
  const topDisease = diseaseSuggestions[0] || null;

  let diseaseName = 'No disease detected';
  let diseaseConfidence = 0;
  let description = '';
  let chemical = [];
  let biological = [];
  let prevention = [];

  if (topDisease) {
    diseaseName = topDisease.name || 'Unknown Disease';
    diseaseConfidence = Math.round((topDisease.probability || 0) * 100);
    const details = topDisease.details || {};
    description = details.description || '';

    const treatment = details.treatment || {};
    chemical = treatment.chemical || [];
    biological = treatment.biological || [];
    prevention = treatment.prevention || [];

    // Fallback: flatten string arrays vs object arrays
    const flatten = (arr) =>
      arr.map(item => (typeof item === 'string' ? item : item.name || JSON.stringify(item)));

    chemical = flatten(chemical);
    biological = flatten(biological);
    prevention = flatten(prevention);
  }

  return {
    cropName,
    cropConfidence,
    commonNames,
    isHealthy,
    healthProbability,
    diseaseName,
    diseaseConfidence,
    description,
    chemical,
    biological,
    prevention,
    allDiseases: diseaseSuggestions.slice(0, 3).map(d => ({
      name: d.name,
      confidence: Math.round((d.probability || 0) * 100)
    }))
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route 1: POST /api/crop-doctor/analyze
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', upload.single('cropImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded. Please upload a crop image.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const rawData = await analyzeWithKindwise(base64Image, mimeType);
    let parsed = parseKindwiseResult(rawData);

    // Log treatment data from Kindwise for debugging
    console.log('[CropDoctor] Kindwise biological:', parsed.biological?.length || 0, 'items');
    console.log('[CropDoctor] Kindwise chemical:',   parsed.chemical?.length   || 0, 'items');

    // Fill missing biological/chemical with expert database (then Gemini as fallback)
    if (parsed.diseaseName && parsed.diseaseName !== 'No disease detected') {
      parsed = await fillMissingTreatments(parsed);
    }

    // Return analysis + base64 image so frontend can embed in PDF request
    res.json({
      success: true,
      analysis: parsed,
      imageBase64: base64Image,
      imageMimeType: mimeType
    });

  } catch (err) {
    const kindwiseErr = err.response?.data;
    const kindwiseStatus = err.response?.status;
    console.error('[CropDoctor] Analyze error - Status:', kindwiseStatus);
    console.error('[CropDoctor] Analyze error - Body:', JSON.stringify(kindwiseErr));
    console.error('[CropDoctor] Analyze error - Message:', err.message);
    const msg = (typeof kindwiseErr === 'string' ? kindwiseErr : kindwiseErr?.error) || err.message || 'Analysis failed';
    res.status(500).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route 2: POST /api/crop-doctor/generate-pdf
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-pdf', async (req, res) => {
  try {
    const { analysis, imageBase64, imageMimeType } = req.body;
    if (!analysis) {
      return res.status(400).json({ success: false, error: 'No analysis data provided' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // ── Response headers ──
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="CropDoctor_Report.pdf"');
    doc.pipe(res);

    // ── Colour Palette ──
    const GREEN_DARK  = '#1a5c2e';
    const GREEN_MID   = '#2d7a47';
    const GREEN_LIGHT = '#e8f5ec';
    const AMBER       = '#b45309';
    const AMBER_BG    = '#fef3c7';
    const RED         = '#b91c1c';
    const RED_BG      = '#fee2e2';
    const BLUE        = '#1e40af';
    const BLUE_BG     = '#dbeafe';
    const GREY_DARK   = '#1f2937';
    const GREY_MID    = '#6b7280';
    const WHITE       = '#ffffff';

    const pageWidth = doc.page.width - 100; // usable width

    // ════════════════════════════════════════════════
    // HEADER BANNER
    // ════════════════════════════════════════════════
    doc.rect(0, 0, doc.page.width, 90).fill(GREEN_DARK);

    // Logo circle
    doc.circle(65, 45, 28).fill(GREEN_MID);
    doc.fontSize(22).fillColor(WHITE).text('🌿', 50, 33, { width: 30, align: 'center' });

    doc.fillColor(WHITE)
      .fontSize(20).font('Helvetica-Bold')
      .text('AI Crops Doctor', 105, 22);
    doc.fontSize(10).font('Helvetica')
      .text('Crop Health Assessment Report — Powered by KRISHISETU', 105, 48);

    // Date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    doc.fontSize(9).fillColor('#a7f3d0')
      .text(`Report Generated: ${dateStr} at ${timeStr}`, 105, 66);

    doc.moveDown(3);

    // ════════════════════════════════════════════════
    // CROP IMAGE + QUICK SUMMARY (side by side)
    // ════════════════════════════════════════════════
    const sectionY = 110;
    const imgSize = 160;

    // Image box
    if (imageBase64) {
      try {
        const imgBuffer = Buffer.from(imageBase64, 'base64');
        doc.image(imgBuffer, 50, sectionY, { width: imgSize, height: imgSize, fit: [imgSize, imgSize] });
        doc.rect(50, sectionY, imgSize, imgSize).stroke(GREEN_MID);
      } catch (e) {
        doc.rect(50, sectionY, imgSize, imgSize).fill('#f3f4f6').stroke(GREEN_MID);
        doc.fontSize(10).fillColor(GREY_MID).text('Image Preview', 50, sectionY + 70, { width: imgSize, align: 'center' });
      }
    }

    // Summary panel
    const summaryX = 230;
    const summaryW = doc.page.width - summaryX - 50;
    doc.rect(summaryX, sectionY, summaryW, imgSize).fill(GREEN_LIGHT).stroke(GREEN_MID);

    doc.fillColor(GREEN_DARK).fontSize(13).font('Helvetica-Bold')
      .text('Diagnosis Summary', summaryX + 12, sectionY + 12);

    doc.fontSize(10).font('Helvetica')
      .fillColor(GREY_DARK)
      .text(`Crop Identified:`, summaryX + 12, sectionY + 34);
    doc.font('Helvetica-Bold').fillColor(GREEN_DARK)
      .text(`${analysis.cropName} (${analysis.cropConfidence}% confidence)`, summaryX + 12, sectionY + 48);

    // Health badge
    const healthLabel = analysis.isHealthy ? '✅  HEALTHY' : '🔴  DISEASE DETECTED';
    const healthBg    = analysis.isHealthy ? GREEN_MID : RED;
    doc.rect(summaryX + 12, sectionY + 68, summaryW - 24, 22).fill(healthBg);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
      .text(healthLabel, summaryX + 12, sectionY + 73, { width: summaryW - 24, align: 'center' });

    if (!analysis.isHealthy) {
      doc.font('Helvetica').fillColor(GREY_DARK).fontSize(10)
        .text(`Disease / Pest:`, summaryX + 12, sectionY + 99);
      doc.font('Helvetica-Bold').fillColor(RED)
        .text(`${analysis.diseaseName}`, summaryX + 12, sectionY + 112);
      doc.font('Helvetica').fillColor(GREY_MID).fontSize(9)
        .text(`Confidence: ${analysis.diseaseConfidence}%`, summaryX + 12, sectionY + 126);
    }

    if (analysis.commonNames?.length) {
      doc.font('Helvetica').fillColor(GREY_MID).fontSize(8)
        .text(`Also known as: ${analysis.commonNames.slice(0,3).join(', ')}`, summaryX + 12, sectionY + 142);
    }

    doc.y = sectionY + imgSize + 20;

    // ════════════════════════════════════════════════
    // Helper: draw a section card
    // ════════════════════════════════════════════════
    const drawCard = (title, emoji, items, bgColor, borderColor, textColor) => {
      if (!items || items.length === 0) return;

      const cardPad = 12;
      const lineH = 16;
      const titleH = 30;
      const cardH = titleH + items.length * lineH + cardPad * 2 + 8;

      if (doc.y + cardH > doc.page.height - 80) doc.addPage();

      const cardY = doc.y;
      // Background
      doc.rect(50, cardY, pageWidth, cardH).fill(bgColor).stroke(borderColor);
      // Title bar
      doc.rect(50, cardY, pageWidth, titleH).fill(borderColor);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12)
        .text(`${emoji}  ${title}`, 62, cardY + 9);

      // Items
      items.forEach((item, i) => {
        const textY = cardY + titleH + cardPad + i * lineH;
        doc.fillColor(textColor).font('Helvetica').fontSize(9.5)
          .text(`•  ${item}`, 62, textY, { width: pageWidth - 24 });
      });

      doc.y = cardY + cardH + 12;
    };

    // ════════════════════════════════════════════════
    // DESCRIPTION
    // ════════════════════════════════════════════════
    if (analysis.description) {
      if (doc.y + 80 > doc.page.height - 80) doc.addPage();
      doc.rect(50, doc.y, pageWidth, 24).fill(GREY_DARK);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
        .text('📋  About the Disease', 62, doc.y - 18);

      doc.moveDown(0.3);
      doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9.5)
        .text(analysis.description, 50, doc.y, { width: pageWidth, align: 'justify' });
      doc.moveDown(1);
    }

    // ════════════════════════════════════════════════
    // SECTION CARDS
    // ════════════════════════════════════════════════
    const organicItems = analysis.biological?.length
      ? analysis.biological
      : ['No biological/organic treatment data available for this diagnosis.'];

    const chemicalItems = analysis.chemical?.length
      ? analysis.chemical
      : ['No chemical treatment data available for this diagnosis.'];

    const preventionItems = analysis.prevention?.length
      ? analysis.prevention
      : ['No prevention data available for this diagnosis.'];

    drawCard(
      'Organic / Biological Remedy',
      '🌿',
      organicItems,
      GREEN_LIGHT,
      GREEN_MID,
      GREY_DARK
    );

    drawCard(
      'Chemical Remedy',
      '🧪',
      chemicalItems,
      AMBER_BG,
      AMBER,
      GREY_DARK
    );

    drawCard(
      'Prevention Tips',
      '🛡️',
      preventionItems,
      BLUE_BG,
      BLUE,
      GREY_DARK
    );

    // ════════════════════════════════════════════════
    // OTHER POSSIBLE DISEASES TABLE
    // ════════════════════════════════════════════════
    if (analysis.allDiseases?.length > 1) {
      if (doc.y + 100 > doc.page.height - 80) doc.addPage();

      doc.rect(50, doc.y, pageWidth, 26).fill(GREY_DARK);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
        .text('🔍  Other Possible Conditions', 62, doc.y - 20);
      doc.moveDown(0.4);

      analysis.allDiseases.forEach((d, i) => {
        const rowBg = i % 2 === 0 ? '#f9fafb' : WHITE;
        doc.rect(50, doc.y, pageWidth, 18).fill(rowBg).stroke('#e5e7eb');
        doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9.5)
          .text(`${i + 1}. ${d.name}`, 62, doc.y + 3);
        doc.fillColor(d.confidence > 60 ? RED : GREY_MID).font('Helvetica-Bold')
          .text(`${d.confidence}%`, 400, doc.y - 14, { width: 80, align: 'right' });
        doc.moveDown(0.15);
      });
      doc.moveDown(1);
    }

    // ════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════
    const footerY = doc.page.height - 55;
    doc.rect(0, footerY, doc.page.width, 55).fill(GREEN_DARK);
    doc.fillColor('#a7f3d0').font('Helvetica').fontSize(8)
      .text(
        '⚠️  This report is AI-generated using the Kindwise Crop Health API. Always consult a certified agronomist before applying treatments.',
        30, footerY + 10, { width: doc.page.width - 60, align: 'center' }
      );
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9)
      .text('KRISHISETU — AI Crops Doctor  |  Empowering Indian Farmers with AI', 30, footerY + 30, {
        width: doc.page.width - 60, align: 'center'
      });

    doc.end();

  } catch (err) {
    console.error('[CropDoctor] PDF error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate PDF: ' + err.message });
    }
  }
});

module.exports = router;
