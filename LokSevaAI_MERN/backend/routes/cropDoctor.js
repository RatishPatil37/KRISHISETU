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
 */
function getTreatmentFromDatabase(diseaseName) {
  if (!diseaseName) return DISEASE_TREATMENTS['default'];
  const lower = diseaseName.toLowerCase();
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

  const dbEntry = getTreatmentFromDatabase(parsed.diseaseName);
  if (needsBio  && dbEntry.biological) parsed.biological = dbEntry.biological;
  if (needsChem && dbEntry.chemical)   parsed.chemical   = dbEntry.chemical;
  console.log('[CropDoctor] Filled from expert database for:', parsed.diseaseName);

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
  limits: { fileSize: 10 * 1024 * 1024 },
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
    { images: [imageData] },
    {
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
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
// Helper: Parse Kindwise response into a clean report object
// ─────────────────────────────────────────────────────────────────────────────
function parseKindwiseResult(data) {
  const result = data.result || {};
  const cropSuggestion  = result.crop?.suggestions?.[0] || {};
  const cropName        = cropSuggestion.name || 'Unknown Crop';
  const cropConfidence  = Math.round((cropSuggestion.probability || 0) * 100);
  const commonNames     = cropSuggestion.details?.common_names || [];
  const isHealthy       = result.is_healthy?.binary ?? null;
  const healthProbability = Math.round((result.is_healthy?.probability || 0) * 100);
  const diseaseSuggestions = result.disease?.suggestions || [];
  const topDisease = diseaseSuggestions[0] || null;

  let diseaseName = 'No disease detected';
  let diseaseConfidence = 0;
  let description = '';
  let chemical = [], biological = [], prevention = [];

  if (topDisease) {
    diseaseName = topDisease.name || 'Unknown Disease';
    diseaseConfidence = Math.round((topDisease.probability || 0) * 100);
    const details   = topDisease.details || {};
    description     = details.description || '';
    const treatment = details.treatment || {};
    chemical        = treatment.chemical   || [];
    biological      = treatment.biological || [];
    prevention      = treatment.prevention || [];
    const flatten = (arr) =>
      arr.map(item => (typeof item === 'string' ? item : item.name || JSON.stringify(item)));
    chemical   = flatten(chemical);
    biological = flatten(biological);
    prevention = flatten(prevention);
  }

  return {
    cropName, cropConfidence, commonNames,
    isHealthy, healthProbability,
    diseaseName, diseaseConfidence, description,
    chemical, biological, prevention,
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
    const mimeType    = req.file.mimetype;
    const rawData     = await analyzeWithKindwise(base64Image, mimeType);
    let parsed        = parseKindwiseResult(rawData);

    console.log('[CropDoctor] Kindwise biological:', parsed.biological?.length || 0, 'items');
    console.log('[CropDoctor] Kindwise chemical:',   parsed.chemical?.length   || 0, 'items');

    if (parsed.diseaseName && parsed.diseaseName !== 'No disease detected') {
      parsed = await fillMissingTreatments(parsed);
    }

    res.json({
      success: true,
      analysis: parsed,
      imageBase64: base64Image,
      imageMimeType: mimeType
    });

  } catch (err) {
    const kindwiseErr    = err.response?.data;
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
// Professional A4 report — fixed layout, no emoji, dynamic card heights
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-pdf', async (req, res) => {
  try {
    const { analysis, imageBase64, imageMimeType } = req.body;
    if (!analysis) {
      return res.status(400).json({ success: false, error: 'No analysis data provided' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="CropDoctor_Report.pdf"');
    doc.pipe(res);

    // ── Palette ──────────────────────────────────────────────────────────────
    const GREEN_DARK  = '#1a5c2e';
    const GREEN_MID   = '#2d7a47';
    const GREEN_LIGHT = '#e8f5ec';
    const AMBER       = '#b45309';
    const AMBER_BG    = '#fef3c7';
    const RED         = '#b91c1c';
    const BLUE        = '#1e40af';
    const BLUE_BG     = '#dbeafe';
    const GREY_DARK   = '#1f2937';
    const GREY_MID    = '#6b7280';
    const WHITE       = '#ffffff';

    const PW       = doc.page.width;   // 595
    const PH       = doc.page.height;  // 842
    const MARGIN   = 50;
    const COL      = PW - MARGIN * 2;  // 495
    const FOOTER_H = 60;
    const SAFE_BTM = PH - FOOTER_H - 10;

    // ── HELPERS ───────────────────────────────────────────────────────────────

    const drawFooter = () => {
      const fy = PH - FOOTER_H;
      doc.rect(0, fy, PW, FOOTER_H).fill(GREEN_DARK);
      doc.fillColor('#a7f3d0').font('Helvetica').fontSize(7.5)
        .text(
          'DISCLAIMER: This report is AI-generated using Kindwise Crop Health API + Expert Disease Database. Always consult a certified agronomist before applying any treatment.',
          MARGIN - 10, fy + 10, { width: PW - (MARGIN - 10) * 2, align: 'center' }
        );
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9)
        .text(
          'KRISHISETU  |  AI Crops Doctor  |  Empowering Indian Farmers with AI',
          MARGIN - 10, fy + 34, { width: PW - (MARGIN - 10) * 2, align: 'center' }
        );
    };

    const ensureSpace = (needed) => {
      if (doc.y + needed > SAFE_BTM) {
        drawFooter();
        doc.addPage();
        doc.y = MARGIN;
      }
    };

    const drawHeading = (text, bgColor) => {
      ensureSpace(34);
      const hy = doc.y;
      doc.rect(MARGIN, hy, COL, 24).fill(bgColor);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10.5)
        .text(text, MARGIN + 10, hy + 7, { width: COL - 20 });
      doc.y = hy + 24 + 8;
    };

    const drawCard = (title, items, bgColor, borderColor) => {
      if (!items || items.length === 0) return;
      const PAD     = 12;
      const TITLE_H = 26;

      doc.font('Helvetica').fontSize(9);
      let bodyH = PAD;
      items.forEach(item => {
        bodyH += doc.heightOfString(`\u2022  ${item}`, { width: COL - PAD * 2 }) + 6;
      });
      bodyH += PAD;
      const cardH = TITLE_H + bodyH;

      ensureSpace(cardH + 16);

      const cardY = doc.y;
      // Background + border accent
      doc.rect(MARGIN, cardY, COL, cardH).fill(bgColor);
      doc.rect(MARGIN, cardY, COL, TITLE_H).fill(borderColor);
      // Left accent stripe
      doc.rect(MARGIN, cardY, 4, cardH).fill(borderColor);

      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10.5)
        .text(title, MARGIN + PAD + 4, cardY + 7, { width: COL - PAD * 2 - 4 });

      let itemY = cardY + TITLE_H + PAD;
      items.forEach(item => {
        const txt = `\u2022  ${item}`;
        const h   = doc.heightOfString(txt, { width: COL - PAD * 2 - 4, fontSize: 9 }) + 6;
        doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9)
          .text(txt, MARGIN + PAD + 4, itemY, { width: COL - PAD * 2 - 4 });
        itemY += h;
      });

      doc.y = cardY + cardH + 14;
    };

    // ════════════════════════════════════════════════════════════
    // (1) HEADER BANNER
    // ════════════════════════════════════════════════════════════
    doc.rect(0, 0, PW, 95).fill(GREEN_DARK);

    doc.fillColor('#a7f3d0').font('Helvetica').fontSize(7.5)
      .text(
        'KRISHISETU  |  AI CROPS DOCTOR  |  CROP HEALTH ASSESSMENT REPORT',
        MARGIN, 12, { width: COL, align: 'center' }
      );
    doc.rect(MARGIN, 23, COL, 0.5).fill('#2d7a47');

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20)
      .text('AI Crops Doctor', MARGIN, 32, { width: COL, align: 'center' });

    doc.fillColor('#bbf7d0').font('Helvetica').fontSize(9.5)
      .text('Powered by Kindwise Crop Health API & KRISHISETU Expert Disease Database', MARGIN, 57, {
        width: COL, align: 'center'
      });

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    doc.fillColor('#6ee7b7').font('Helvetica').fontSize(8)
      .text(`Report Date: ${dateStr}  at  ${timeStr}`, MARGIN, 75, { width: COL, align: 'center' });

    // ════════════════════════════════════════════════════════════
    // (2) CROP IMAGE + DIAGNOSIS SUMMARY — side by side
    // ════════════════════════════════════════════════════════════
    const sectionY = 108;
    const IMG_SZ   = 150;
    const SUM_X    = MARGIN + IMG_SZ + 18;
    const SUM_W    = COL - IMG_SZ - 18;

    if (imageBase64) {
      try {
        const buf = Buffer.from(imageBase64, 'base64');
        doc.image(buf, MARGIN, sectionY, { width: IMG_SZ, height: IMG_SZ, fit: [IMG_SZ, IMG_SZ] });
      } catch (_) {
        doc.rect(MARGIN, sectionY, IMG_SZ, IMG_SZ).fill('#f3f4f6');
        doc.fillColor(GREY_MID).font('Helvetica').fontSize(9)
          .text('(Image unavailable)', MARGIN, sectionY + 65, { width: IMG_SZ, align: 'center' });
      }
      doc.rect(MARGIN, sectionY, IMG_SZ, IMG_SZ).stroke(GREEN_MID);
    }

    doc.rect(SUM_X, sectionY, SUM_W, IMG_SZ).fill(GREEN_LIGHT).stroke(GREEN_MID);

    doc.fillColor(GREEN_DARK).font('Helvetica-Bold').fontSize(11.5)
      .text('Diagnosis Summary', SUM_X + 10, sectionY + 9);
    doc.rect(SUM_X + 10, sectionY + 25, SUM_W - 20, 0.5).fill(GREEN_MID);

    doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
      .text('CROP IDENTIFIED', SUM_X + 10, sectionY + 32);
    doc.fillColor(GREEN_DARK).font('Helvetica-Bold').fontSize(10)
      .text(
        `${analysis.cropName}  (${analysis.cropConfidence}% confidence)`,
        SUM_X + 10, sectionY + 43, { width: SUM_W - 20 }
      );

    const badgeBg    = analysis.isHealthy ? GREEN_MID : RED;
    const badgeLabel = analysis.isHealthy ? 'HEALTHY CROP' : 'DISEASE DETECTED';
    doc.rect(SUM_X + 10, sectionY + 61, SUM_W - 20, 19).fill(badgeBg);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text(badgeLabel, SUM_X + 10, sectionY + 66, { width: SUM_W - 20, align: 'center' });

    if (!analysis.isHealthy) {
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
        .text('DISEASE / PEST', SUM_X + 10, sectionY + 87);
      doc.fillColor(RED).font('Helvetica-Bold').fontSize(9)
        .text(analysis.diseaseName, SUM_X + 10, sectionY + 98, { width: SUM_W - 20 });
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
        .text(`Confidence: ${analysis.diseaseConfidence}%`, SUM_X + 10, sectionY + 112);
    }

    if (analysis.commonNames && analysis.commonNames.length > 0) {
      const knY = analysis.isHealthy ? sectionY + 85 : sectionY + 126;
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(7.5)
        .text(
          `Also known as: ${analysis.commonNames.slice(0, 3).join(', ')}`,
          SUM_X + 10, knY, { width: SUM_W - 20 }
        );
    }

    doc.y = sectionY + IMG_SZ + 20;

    // ════════════════════════════════════════════════════════════
    // (3) ABOUT THE DISEASE
    // ════════════════════════════════════════════════════════════
    if (analysis.description) {
      drawHeading('About the Disease', GREY_DARK);
      const descH = doc.heightOfString(analysis.description, { width: COL, fontSize: 9.5 });
      ensureSpace(descH + 20);
      doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9.5)
        .text(analysis.description, MARGIN, doc.y, { width: COL, align: 'justify' });
      doc.moveDown(1.2);
    }

    // ════════════════════════════════════════════════════════════
    // (4) REMEDY CARDS
    // ════════════════════════════════════════════════════════════
    const organicItems = (analysis.biological && analysis.biological.length)
      ? analysis.biological
      : ['No biological/organic treatment data available for this diagnosis.'];

    const chemicalItems = (analysis.chemical && analysis.chemical.length)
      ? analysis.chemical
      : ['No chemical treatment data available for this diagnosis.'];

    const preventionItems = (analysis.prevention && analysis.prevention.length)
      ? analysis.prevention
      : ['No prevention tips available for this diagnosis.'];

    drawCard('[ORGANIC / BIOLOGICAL REMEDY]  Natural & Bio-based Treatments', organicItems,    GREEN_LIGHT, GREEN_MID);
    drawCard('[CHEMICAL REMEDY]  Approved Agrochemical Treatments',           chemicalItems,   AMBER_BG,    AMBER);
    drawCard('[PREVENTION TIPS]  Proactive Crop Protection Measures',         preventionItems, BLUE_BG,     BLUE);

    // ════════════════════════════════════════════════════════════
    // (5) OTHER POSSIBLE CONDITIONS TABLE
    // ════════════════════════════════════════════════════════════
    if (analysis.allDiseases && analysis.allDiseases.length > 1) {
      ensureSpace(70);
      drawHeading('Other Possible Conditions', GREY_DARK);

      const tY  = doc.y;
      const ROW = 20;
      doc.rect(MARGIN, tY, COL, ROW).fill(GREEN_DARK);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5)
        .text('Condition / Disease Name', MARGIN + 8, tY + 5, { width: COL * 0.62 });
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5)
        .text('AI Confidence', MARGIN + COL * 0.62, tY + 5, { width: COL * 0.35, align: 'right' });
      doc.y = tY + ROW;

      analysis.allDiseases.forEach((d, i) => {
        ensureSpace(ROW + 2);
        const rowBg = i % 2 === 0 ? '#f9fafb' : WHITE;
        const rowY  = doc.y;
        doc.rect(MARGIN, rowY, COL, ROW).fill(rowBg).stroke('#e5e7eb');
        doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9)
          .text(`${i + 1}.  ${d.name}`, MARGIN + 8, rowY + 5, { width: COL * 0.62 });
        const cc = d.confidence > 60 ? RED : GREY_MID;
        doc.fillColor(cc).font('Helvetica-Bold').fontSize(9)
          .text(`${d.confidence}%`, MARGIN + COL * 0.62, rowY + 5, { width: COL * 0.35, align: 'right' });
        doc.y = rowY + ROW;
      });
      doc.moveDown(1);
    }

    // ════════════════════════════════════════════════════════════
    // (6) FOOTER on last page
    // ════════════════════════════════════════════════════════════
    drawFooter();
    doc.end();

  } catch (err) {
    console.error('[CropDoctor] PDF error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate PDF: ' + err.message });
    }
  }
});

module.exports = router;
