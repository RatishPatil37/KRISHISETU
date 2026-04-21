const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// ─────────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────────
// __dirname = <repo>/LokSevaAI_MERN/backend/routes
// Model     = <repo>/Model/Crop_Model.pt  (3 levels up from routes/)
const MODEL_PATH = path.resolve(__dirname, '../../../Model/Crop_Model.pt');
const PY_SCRIPT  = path.resolve(__dirname, '../services/crop_model_inference.py');

// ─────────────────────────────────────────────────────────────────────────────
// 24 class labels — mirrors Crop_Model.pt training labels
// ─────────────────────────────────────────────────────────────────────────────
const CLASS_LABELS = {
  0:  'Apple__Apple_scab',
  1:  'Apple__Black_rot',
  2:  'Apple__Cedar_apple_rust',
  3:  'Apple__healthy',
  4:  'Bellpepper__Bacterial_spot',
  5:  'Bellpepper__healthy',
  6:  'Corn__Common_rust',
  7:  'Corn__Gray_leaf_spot',
  8:  'Corn__Northern_Leaf_Blight',
  9:  'Corn__healthy',
  10: 'Grape__Black_Measles',
  11: 'Grape__Black_rot',
  12: 'Grape__Leaf_blight',
  13: 'Grape__healthy',
  14: 'Potato__Early_blight',
  15: 'Potato__Late_blight',
  16: 'Potato__healthy',
  17: 'Rice__Brown_Spot',
  18: 'Rice__Healthy',
  19: 'Rice__Leaf_Blast',
  20: 'Rice__Neck_Blast',
  21: 'Wheat__Brown_Rust',
  22: 'Wheat__Healthy',
  23: 'Wheat__Yellow_Rust',
};

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Expert Disease Treatment Database (fallback if Gemini fails)
// ─────────────────────────────────────────────────────────────────────────────
const DISEASE_TREATMENTS = {
  'apple scab': {
    biological: [
      'Apply Trichoderma harzianum biocontrol agent around the plant base at 5g/litre water.',
      'Spray neem oil (5ml/litre) every 7 days before bud break to suppress Venturia inaequalis spores.',
      'Apply Bacillus subtilis-based biofungicide at 10g/litre water at weekly intervals.',
      'Use Bordeaux mixture (1%) as a copper-based organic protectant spray during wet weather.',
    ],
    chemical: [
      'Spray Myclobutanil 10 WP at 1g/litre water at 10-14 day intervals during bud break.',
      'Apply Captan 50 WP at 2g/litre water — highly effective protective fungicide for apple scab.',
      'Use Mancozeb 75 WP at 2.5g/litre water as a broad-spectrum protective spray.',
    ],
    prevention: [
      'Plant resistant apple varieties such as Florina or Liberty.',
      'Rake and destroy fallen infected leaves to reduce overwintering inoculum.',
      'Prune trees for good air circulation to reduce leaf wetness periods.',
      'Apply preventive sprays during early spring before infection periods.',
    ]
  },
  'black rot': {
    biological: [
      'Apply copper oxychloride 50 WP at 3g/litre water as organic-approved bactericide/fungicide.',
      'Spray Bacillus subtilis-based biofungicide at 10g/litre water every 10 days.',
      'Use neem oil (5ml/litre) + garlic extract spray (10ml/litre) weekly.',
      'Remove and destroy all mummified fruits, cankers, and infected wood immediately.',
    ],
    chemical: [
      'Apply Thiophanate-methyl 70 WP at 1.5g/litre water every 10-14 days.',
      'Spray Iprodione 50 WP at 2g/litre water as curative fungicide.',
      'Use Captan 50 WP at 2g/litre water as broad-spectrum protective fungicide.',
    ],
    prevention: [
      'Prune out dead wood and cankers during dry weather; disinfect pruning tools.',
      'Avoid mechanical injuries to fruit and stems during field operations.',
      'Maintain good orchard sanitation — remove all infected plant debris.',
      'Apply dormant copper sprays before budbreak each season.',
    ]
  },
  'cedar apple rust': {
    biological: [
      'Remove nearby juniper (cedar) trees within 300m to break the alternate host cycle.',
      'Spray neem oil (5ml/litre) during spring when spores are released.',
      'Apply Bacillus subtilis biofungicide spray weekly during pink bud stage.',
      'Use Bordeaux mixture (1%) as preventive copper spray in early season.',
    ],
    chemical: [
      'Apply Myclobutanil 10 WP at 1g/litre water from pink bud to petal fall stage.',
      'Spray Triadimefon 25 WP at 1g/litre water at 10-day intervals.',
      'Use Propiconazole 25 EC at 1ml/litre water as systemic fungicide.',
    ],
    prevention: [
      'Plant rust-resistant apple varieties (e.g., Redfree, Liberty).',
      'Remove galls from nearby juniper trees in late winter before spore release.',
      'Apply protective fungicide sprays before forecasted rust infection periods.',
      'Avoid planting apple orchards near juniper/cedar hedgerows.',
    ]
  },
  'bacterial spot': {
    biological: [
      'Spray copper oxychloride 50 WP (3g/litre) as organic-approved bactericide.',
      'Apply Pseudomonas fluorescens (10g/litre water) foliar spray every 10 days.',
      'Use Streptomyces lydicus biobactericide as foliar treatment.',
      'Maintain field hygiene and remove infected crop debris regularly.',
    ],
    chemical: [
      'Apply Copper hydroxide 77 WP at 3g/litre water as bactericidal spray.',
      'Spray Streptomycin sulfate 90% SP at 0.5g/litre water at infection onset.',
      'Use Kasugamycin 2% SL at 2ml/litre water for systemic bacterial control.',
    ],
    prevention: [
      'Use certified disease-free transplants and resistant pepper varieties.',
      'Avoid overhead irrigation; use drip irrigation to reduce leaf wetness.',
      'Practice 2-3 year crop rotation away from solanaceous crops.',
      'Apply copper sprays preventively during warm humid weather.',
    ]
  },
  'common rust': {
    biological: [
      'Apply Trichoderma viride at 5g/litre water as soil drenching and foliar spray.',
      'Use neem-based biopesticide at 3ml/litre water weekly during humid season.',
      'Spray Pseudomonas fluorescens (10g/litre) as biocontrol foliar spray.',
      'Apply Bacillus subtilis solution to suppress rust fungus development.',
    ],
    chemical: [
      'Apply Tebuconazole 250 EC at 1ml/litre water at first sign of rust pustules.',
      'Spray Propiconazole 25 EC at 1ml/litre water every 14 days during season.',
      'Use Mancozeb 75 WP at 2.5g/litre water as protective fungicide.',
    ],
    prevention: [
      'Plant rust-resistant corn hybrids recommended for your region.',
      'Avoid late planting which extends exposure to humid rust-favorable conditions.',
      'Monitor fields regularly and apply preventive fungicides when rust risk is high.',
      'Practice crop rotation to reduce disease pressure between seasons.',
    ]
  },
  'gray leaf spot': {
    biological: [
      'Apply Trichoderma harzianum at 5g/litre water as foliar spray.',
      'Use neem oil (5ml/litre) + soap solution spray every 7-10 days.',
      'Spray Bacillus subtilis biofungicide at 10-day intervals.',
      'Use copper-based organic spray (Bordeaux mixture 1%) preventively.',
    ],
    chemical: [
      'Spray Azoxystrobin 23 SC at 1ml/litre water — highly effective against gray leaf spot.',
      'Apply Pyraclostrobin 250 EC at 0.75ml/litre water as systemic protectant.',
      'Use Propiconazole 25 EC at 1ml/litre water every 14 days.',
    ],
    prevention: [
      'Plant gray leaf spot resistant corn hybrids.',
      'Practice crop rotation — avoid continuous corn planting.',
      'Avoid excessive nitrogen fertilization which promotes dense canopy.',
      'Till infected crop residue after harvest to reduce inoculum.',
    ]
  },
  'northern leaf blight': {
    biological: [
      'Apply Trichoderma-based biofungicide spray at 10g/litre water every 10 days.',
      'Spray neem oil (5ml/litre) and neem seed kernel extract preventively.',
      'Use Bacillus subtilis foliar spray to suppress Exserohilum turcicum.',
      'Apply copper-based organic spray (3g/litre) during humid weather.',
    ],
    chemical: [
      'Apply Azoxystrobin + Propiconazole combination at recommended label rates.',
      'Spray Mancozeb 75 WP at 2.5g/litre water every 10 days as protective spray.',
      'Use Tebuconazole 250 EC at 1ml/litre water as systemic curative fungicide.',
    ],
    prevention: [
      'Plant NLB-resistant corn varieties (check local extension recommendations).',
      'Practice crop rotation with non-host crops (soybeans, small grains).',
      'Avoid minimum tillage in fields with high disease history.',
      'Apply preventive fungicides when weather conditions favor disease.',
    ]
  },
  'black measles': {
    biological: [
      'Apply Trichoderma harzianum soil drench around vine root zones.',
      'Prune out and destroy infected wood during dormant season.',
      'Use Bacillus subtilis-based biofungicide spray on pruning wounds.',
      'Apply copper-based organic spray to protect fresh pruning cuts.',
    ],
    chemical: [
      'Spray Thiophanate-methyl 70 WP at 1.5g/litre on pruning wounds within 24 hours.',
      'Apply sodium arsenite (where legal) as dormant pruning wound treatment.',
      'Use Tebuconazole 250 EC on symptomatic vines for systemic action.',
    ],
    prevention: [
      'Make clean pruning cuts during dry weather; seal large cuts immediately.',
      'Remove and destroy all infected wood from the vineyard.',
      'Avoid over-cropping and water stress which predispose vines to Esca.',
      'Disinfect pruning tools between vines with 10% bleach solution.',
    ]
  },
  'leaf blight': {
    biological: [
      'Apply neem oil (5ml/litre) + liquid soap (2ml/litre) spray every 7 days.',
      'Spray copper sulfate + lime (Bordeaux mixture 1%) as protective spray.',
      'Use Bacillus subtilis biofungicide foliar spray at 10-day intervals.',
      'Apply compost tea spray to enhance plant immunity.',
    ],
    chemical: [
      'Spray Mancozeb 75 WP at 2.5g/litre water every 7-10 days preventively.',
      'Apply Metalaxyl + Mancozeb (2.5g/litre) for broad-spectrum control.',
      'Use Azoxystrobin 23 SC at 1ml/litre water as systemic protectant.',
    ],
    prevention: [
      'Ensure adequate plant spacing for air circulation in vineyards/fields.',
      'Avoid excessive nitrogen which promotes lush susceptible growth.',
      'Apply preventive sprays before expected wet periods.',
      'Remove and destroy infected leaves and plant debris from the field.',
    ]
  },
  'early blight': {
    biological: [
      'Apply copper-based organic spray (copper sulfate 3g + lime 3g per litre) weekly.',
      'Use neem oil (5ml/litre) + soap solution spray every 5-7 days.',
      'Spray Bacillus subtilis (1g/litre) as organic fungal suppressant.',
      'Apply compost tea spray to boost plant immunity against Alternaria solani.',
    ],
    chemical: [
      'Apply Mancozeb 75 WP at 2g/litre water every 7-10 days as protective spray.',
      'Spray Chlorothalonil 75 WP at 2g/litre water — do not apply within 14 days of harvest.',
      'Use Iprodione 50 WP at 2g/litre for curative treatment after infection appears.',
    ],
    prevention: [
      'Practice 3-year crop rotation away from potato/tomato families.',
      'Mulch soil to prevent soil splash-up to lower leaves.',
      'Remove infected lower leaves promptly as plants mature.',
      'Use certified disease-free seed tubers each season.',
    ]
  },
  'late blight': {
    biological: [
      'Apply copper hydroxide 77 WP (organic-approved) at 3g/litre water preventively.',
      'Use Bacillus amyloliquefaciens spray as biological control every 7 days.',
      'Spray diluted neem oil (5ml/litre) + potassium bicarbonate (5g/litre) solution.',
      'Remove and destroy infected leaves immediately to prevent airborne spread.',
    ],
    chemical: [
      'Apply Metalaxyl + Mancozeb (Ridomil Gold) at 2.5g/litre water at first symptom.',
      'Spray Cymoxanil + Famoxadone at 0.5g/litre water every 7-10 days.',
      'Use Dimethomorph 50 WP at 1g/litre water for systemic curative action.',
    ],
    prevention: [
      'Plant late blight resistant potato varieties (e.g., Sarpo Mira).',
      'Destroy all volunteer potato plants and nightshade weeds promptly.',
      'Avoid overhead irrigation; irrigate in early morning to reduce leaf wetness.',
      'Haulm destruction 2 weeks before harvest reduces tuber infection.',
    ]
  },
  'brown spot': {
    biological: [
      'Apply Trichoderma harzianum at 5g/litre water as foliar spray in early season.',
      'Use neem oil (5ml/litre) + soap solution spray every 7 days.',
      'Spray Pseudomonas fluorescens (10g/litre) as biocontrol foliar spray.',
      'Apply Bacillus subtilis biofungicide spray at 10-day intervals.',
    ],
    chemical: [
      'Apply Mancozeb 75 WP at 2.5g/litre water every 10 days as protective spray.',
      'Spray Propiconazole 25 EC at 1ml/litre water at tillering and booting stages.',
      'Use Tebuconazole 250 EC at 1ml/litre water for systemic curative control.',
    ],
    prevention: [
      'Use balanced fertilization — adequate potassium reduces brown spot severity.',
      'Maintain optimal water levels in paddy fields; avoid moisture stress.',
      'Use certified disease-free seeds treated with fungicide before sowing.',
      'Grow resistant rice varieties recommended for your region.',
    ]
  },
  'leaf blast': {
    biological: [
      'Apply silicon fertilizer (silica gel 2g/litre) to strengthen leaf cell walls against Magnaporthe.',
      'Use Trichoderma harzianum seed treatment at 10g/kg seed.',
      'Spray Pseudomonas fluorescens (10g/litre) as biocontrol agent every 10 days.',
      'Apply neem oil (5ml/litre) spray as suppressive treatment.',
    ],
    chemical: [
      'Spray Tricyclazole 75 WP at 0.6g/litre water at tillering — highly specific for blast.',
      'Apply Carbendazim + Mancozeb at 2g/litre water preventively.',
      'Use Isoprothiolane 40 EC at 1.5ml/litre water for systemic blast control.',
    ],
    prevention: [
      'Avoid excessive nitrogen fertilization — split nitrogen application into 3 doses.',
      'Grow blast-resistant rice varieties (check ICAR/local recommendations).',
      'Avoid early or late planting that coincides with high blast risk periods.',
      'Drain fields periodically to reduce humidity at crop canopy level.',
    ]
  },
  'neck blast': {
    biological: [
      'Apply Trichoderma-based biofungicide at heading stage spray.',
      'Use silicon supplementation (potassium silicate 2g/litre) to strengthen neck tissue.',
      'Spray Pseudomonas fluorescens (10g/litre) before heading stage.',
      'Remove severely infected panicles to reduce secondary spread.',
    ],
    chemical: [
      'Apply Tricyclazole 75 WP at 0.6g/litre water at boot leaf stage (critical timing).',
      'Spray Isoprothiolane 40 EC at 1.5ml/litre water at 50% heading.',
      'Use Propiconazole 25 EC at 1ml/litre water if infection is detected early.',
    ],
    prevention: [
      'Time planting to avoid panicle heading during prolonged wet/humid weather.',
      'Avoid excessive nitrogen — use potassium and silicon for stronger stems.',
      'Plant neck blast tolerant rice varieties.',
      'Apply preventive fungicide at boot leaf and early heading stages.',
    ]
  },
  'brown rust': {
    biological: [
      'Apply Trichoderma viride at 5g/litre water as foliar spray at first symptoms.',
      'Use neem-based biopesticide (Azadirachtin 0.03%) at 3ml/litre water weekly.',
      'Spray Bacillus subtilis solution to suppress Puccinia triticina development.',
      'Apply Bordeaux mixture (1%) as copper-based organic protectant.',
    ],
    chemical: [
      'Spray Tebuconazole 250 EC at 1ml/litre water at flag leaf stage (critical).',
      'Apply Propiconazole 25 EC at 1ml/litre water every 14 days.',
      'Use Triadimefon 25 WP at 1g/litre water from boot to heading stage.',
    ],
    prevention: [
      'Grow rust-resistant wheat varieties (check national wheat program recommendations).',
      'Avoid late sowing which increases rust risk during grain fill stage.',
      'Apply nitrogen in splits — avoid excess N which increases susceptibility.',
      'Monitor crop regularly and apply fungicide at first sign of rust pustules.',
    ]
  },
  'yellow rust': {
    biological: [
      'Apply Trichoderma harzianum at 5g/litre water as early season protective spray.',
      'Use Pseudomonas fluorescens (10g/litre) as biocontrol foliar spray.',
      'Spray neem oil (5ml/litre) every 7 days to suppress Puccinia striiformis.',
      'Apply copper oxychloride (3g/litre) as organic-approved protectant.',
    ],
    chemical: [
      'Apply Propiconazole 25 EC at 1ml/litre water immediately at first sign of stripe rust.',
      'Spray Tebuconazole 250 EC at 1ml/litre water at flag leaf stage.',
      'Use Hexaconazole 5 EC at 2ml/litre water every 10-14 days.',
    ],
    prevention: [
      'Plant yellow rust resistant wheat varieties — critical for stripe rust management.',
      'Avoid early sowing in rust-prone areas.',
      'Apply preventive fungicide during cool moist weather favorable for yellow rust.',
      'Monitor fields regularly from tillering stage, especially in cool seasons.',
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
    ],
    prevention: [
      'Practice crop rotation every season to break disease cycles.',
      'Use certified disease-free seeds from reputable suppliers.',
      'Maintain proper plant spacing for adequate air circulation.',
      'Monitor your field regularly for early signs of disease or pest infestation.',
    ]
  }
};

function getTreatmentFromDatabase(condition) {
  if (!condition) return DISEASE_TREATMENTS['default'];
  const lower = condition.toLowerCase();
  for (const key of Object.keys(DISEASE_TREATMENTS)) {
    if (key === 'default') continue;
    if (lower.includes(key) || key.split(' ').every(word => lower.includes(word))) {
      return DISEASE_TREATMENTS[key];
    }
  }
  return DISEASE_TREATMENTS['default'];
}

function fillMissingTreatments(parsed) {
  const needsBio  = !parsed.biological || parsed.biological.length === 0;
  const needsChem = !parsed.chemical   || parsed.chemical.length   === 0;
  const needsPrev = !parsed.prevention || parsed.prevention.length === 0;
  if (!needsBio && !needsChem && !needsPrev) return parsed;

  const dbEntry = getTreatmentFromDatabase(parsed.diseaseName);
  if (needsBio  && dbEntry.biological) parsed.biological = dbEntry.biological;
  if (needsChem && dbEntry.chemical)   parsed.chemical   = dbEntry.chemical;
  if (needsPrev && dbEntry.prevention) parsed.prevention = dbEntry.prevention;
  console.log('[CropDoctor] Filled missing treatments from expert DB for:', parsed.diseaseName);
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multer: Store in memory (we write a temp file for Python)
// ─────────────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WebP images allowed'));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Run Crop_Model.pt inference via Python child process
// ─────────────────────────────────────────────────────────────────────────────
function runModelInference(imageBuffer, mimeType) {
  return new Promise((resolve, reject) => {
    const ext     = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const tmpPath = path.join(os.tmpdir(), `crop_tmp_${Date.now()}.${ext}`);
    fs.writeFileSync(tmpPath, imageBuffer);

    // Use 'python' on Windows, 'python3' on Linux/Mac
    const pyExec = process.platform === 'win32' ? 'python' : 'python3';

    console.log(`[CropDoctor] Starting Python inference...`);
    console.log(`[CropDoctor] Model : ${MODEL_PATH}`);
    console.log(`[CropDoctor] Script: ${PY_SCRIPT}`);
    console.log(`[CropDoctor] Image : ${tmpPath}`);

    const proc = spawn(pyExec, [PY_SCRIPT, tmpPath, MODEL_PATH], { timeout: 90000 });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', () => {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
      if (stderr) console.warn('[CropDoctor] Python stderr:\n', stderr);

      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.error) return reject(new Error(parsed.error));
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Model output parse error. stdout="${stdout.trim()}" stderr="${stderr.trim()}"`));
      }
    });

    proc.on('error', err => {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
      reject(new Error(`Cannot start Python: ${err.message}. Install Python + PyTorch.`));
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Ask Gemini to generate full disease report
// Model already tells us: cropName + condition + isHealthy
// Gemini adds: description, biological, chemical, prevention, allDiseases
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithGemini(cropName, condition, isHealthy, confidence, imageBase64, mimeType) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.includes('YOUR_')) {
    throw new Error('GEMINI_API_KEY not configured in .env');
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const healthStatus = isHealthy ? 'HEALTHY' : `DISEASED — condition: "${condition}"`;

  const prompt = `
You are an expert agronomist AI for Indian farmers.

A trained crop disease detection model (Crop_Model.pt, 24-class classifier) has analyzed this image and determined:
- Crop: ${cropName}
- Health Status: ${healthStatus}
- Detection Confidence: ${Math.round(confidence * 100)}%

Based on this classification and the image provided, generate a complete structured health report.

RESPOND ONLY with a valid raw JSON object — NO markdown, NO code fences, NO extra text:

{
  "healthProbability": <0-100 integer — how healthy the crop is>,
  "diseaseConfidence": <0-100 integer — confidence in disease detection>,
  "description": "<2-3 sentences describing the identified condition, its causes, and visible symptoms>",
  "biological": [
    "<organic/biological treatment 1 — specific dosage and method>",
    "<organic/biological treatment 2>",
    "<organic/biological treatment 3>",
    "<organic/biological treatment 4>"
  ],
  "chemical": [
    "<chemical treatment 1 — specific product name, dosage, and timing>",
    "<chemical treatment 2>",
    "<chemical treatment 3>"
  ],
  "prevention": [
    "<prevention tip 1>",
    "<prevention tip 2>",
    "<prevention tip 3>",
    "<prevention tip 4>"
  ],
  "allDiseases": [
    {"name": "<most likely condition>", "confidence": <0-100>},
    {"name": "<second possible condition>", "confidence": <0-100>}
  ]
}

${isHealthy
  ? 'Since the crop is HEALTHY: set diseaseConfidence=0, provide general crop care in treatment fields, and allDiseases should list only the healthy status.'
  : `Focus specifically on "${condition}" in ${cropName}. Provide treatments that are relevant to Indian agricultural conditions.`
}
`;

  const imagePart = { inlineData: { data: imageBase64, mimeType } };
  const resultObj = await model.generateContent([prompt, imagePart]);
  let text = resultObj.response.text().trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  return JSON.parse(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Route 1: POST /api/crop-doctor/analyze
// Flow: image → Crop_Model.pt (Python) → crop+condition → Gemini → report
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', upload.single('cropImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded.' });
    }

    const imageBuffer = req.file.buffer;
    const mimeType    = req.file.mimetype;
    const base64Image = imageBuffer.toString('base64');

    // ── Step 1: Local model — identify crop and condition ─────────────────
    let modelResult;
    try {
      modelResult = await runModelInference(imageBuffer, mimeType);
    } catch (modelErr) {
      console.error('[CropDoctor] Model error:', modelErr.message);
      return res.status(500).json({
        success: false,
        error: `Custom model inference failed: ${modelErr.message}`
      });
    }

    const { cropName, condition, isHealthy, confidence, allPredictions } = modelResult;
    console.log(`[CropDoctor] ✅ Model result: ${cropName} | ${condition} | healthy=${isHealthy} | conf=${Math.round(confidence*100)}%`);

    // ── Step 2: Gemini — full disease analysis & treatment report ─────────
    let geminiData;
    try {
      geminiData = await analyzeWithGemini(cropName, condition, isHealthy, confidence, base64Image, mimeType);
    } catch (gemErr) {
      console.error('[CropDoctor] Gemini error:', gemErr.message);
      // Graceful fallback using expert DB
      const dbT = getTreatmentFromDatabase(condition);
      geminiData = {
        healthProbability:  isHealthy ? 95 : 10,
        diseaseConfidence:  isHealthy ? 0  : Math.round(confidence * 100),
        description:        `Crop identified as ${cropName}. Condition: ${condition}. (Gemini unavailable: ${gemErr.message})`,
        biological:  dbT.biological  || [],
        chemical:    dbT.chemical    || [],
        prevention:  dbT.prevention  || [],
        allDiseases: [{ name: condition, confidence: Math.round(confidence * 100) }]
      };
    }

    // ── Step 3: Build final analysis object ───────────────────────────────
    // secondary model predictions shown as "other possible conditions"
    const otherPreds = (allPredictions || [])
      .slice(1, 4)
      .map(p => ({ name: `${p.cropName} — ${p.condition}`, confidence: Math.round(p.confidence * 100) }));

    let analysis = {
      cropName:          cropName,
      cropConfidence:    Math.round(confidence * 100),
      commonNames:       (allPredictions || []).slice(1, 3).map(p => p.condition),
      isHealthy:         isHealthy,
      healthProbability: geminiData.healthProbability || (isHealthy ? 95 : 10),
      diseaseName:       isHealthy ? 'Healthy' : condition,
      diseaseConfidence: geminiData.diseaseConfidence || (isHealthy ? 0 : Math.round(confidence * 100)),
      description:       geminiData.description  || '',
      biological:        geminiData.biological   || [],
      chemical:          geminiData.chemical     || [],
      prevention:        geminiData.prevention   || [],
      allDiseases:       (geminiData.allDiseases || otherPreds).slice(0, 3),
      // extra fields for traceability
      fullLabel:         modelResult.fullLabel,
      classIndex:        modelResult.classIndex,
    };

    // Fill any empty treatment slots from expert DB
    if (!isHealthy) {
      analysis = fillMissingTreatments(analysis);
    }

    res.json({ success: true, analysis, imageBase64: base64Image, imageMimeType: mimeType });

  } catch (err) {
    console.error('[CropDoctor] Unexpected error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Analysis failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route 2: POST /api/crop-doctor/generate-pdf
// Professional A4 report
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

    const PW       = doc.page.width;
    const PH       = doc.page.height;
    const MARGIN   = 50;
    const COL      = PW - MARGIN * 2;
    const FOOTER_H = 60;
    const SAFE_BTM = PH - FOOTER_H - 10;

    const drawFooter = () => {
      const fy = PH - FOOTER_H;
      doc.rect(0, fy, PW, FOOTER_H).fill(GREEN_DARK);
      doc.fillColor('#a7f3d0').font('Helvetica').fontSize(7.5)
        .text(
          'DISCLAIMER: This report is AI-generated using Custom Crop_Model.pt (24-class classifier) + Gemini AI. Always consult a certified agronomist before applying any treatment.',
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
      doc.rect(MARGIN, cardY, COL, cardH).fill(bgColor);
      doc.rect(MARGIN, cardY, COL, TITLE_H).fill(borderColor);
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

    // ── (1) HEADER ───────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 95).fill(GREEN_DARK);
    doc.fillColor('#a7f3d0').font('Helvetica').fontSize(7.5)
      .text('KRISHISETU  |  AI CROPS DOCTOR  |  CROP HEALTH ASSESSMENT REPORT', MARGIN, 12, { width: COL, align: 'center' });
    doc.rect(MARGIN, 23, COL, 0.5).fill('#2d7a47');
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20)
      .text('AI Crops Doctor', MARGIN, 32, { width: COL, align: 'center' });
    doc.fillColor('#bbf7d0').font('Helvetica').fontSize(9.5)
      .text('Powered by Custom Crop_Model.pt (24-Class AI) & Gemini AI  |  KRISHISETU Expert Disease Database', MARGIN, 57, { width: COL, align: 'center' });
    const now = new Date();
    doc.fillColor('#6ee7b7').font('Helvetica').fontSize(8)
      .text(
        `Report Date: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}  at  ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        MARGIN, 75, { width: COL, align: 'center' }
      );

    // ── (2) CROP IMAGE + DIAGNOSIS SUMMARY ───────────────────────────────────
    const sectionY = 108;
    const IMG_SZ   = 150;
    const SUM_X    = MARGIN + IMG_SZ + 18;
    const SUM_W    = COL - IMG_SZ - 18;

    if (imageBase64) {
      try {
        doc.image(Buffer.from(imageBase64, 'base64'), MARGIN, sectionY, { width: IMG_SZ, height: IMG_SZ, fit: [IMG_SZ, IMG_SZ] });
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
      .text(`${analysis.cropName}  (${analysis.cropConfidence}% confidence)`, SUM_X + 10, sectionY + 43, { width: SUM_W - 20 });

    const badgeBg    = analysis.isHealthy ? GREEN_MID : RED;
    const badgeLabel = analysis.isHealthy ? 'HEALTHY CROP' : 'DISEASE DETECTED';
    doc.rect(SUM_X + 10, sectionY + 61, SUM_W - 20, 19).fill(badgeBg);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text(badgeLabel, SUM_X + 10, sectionY + 66, { width: SUM_W - 20, align: 'center' });

    if (!analysis.isHealthy) {
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
        .text('CONDITION DETECTED', SUM_X + 10, sectionY + 87);
      doc.fillColor(RED).font('Helvetica-Bold').fontSize(9)
        .text(analysis.diseaseName, SUM_X + 10, sectionY + 98, { width: SUM_W - 20 });
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
        .text(`Confidence: ${analysis.diseaseConfidence}%`, SUM_X + 10, sectionY + 112);
    }

    // Show model class label for traceability
    if (analysis.fullLabel) {
      const knY = analysis.isHealthy ? sectionY + 85 : sectionY + 126;
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(7)
        .text(`Model class: ${analysis.fullLabel}`, SUM_X + 10, knY, { width: SUM_W - 20 });
    }

    doc.y = sectionY + IMG_SZ + 20;

    // ── (3) ABOUT THE CONDITION ───────────────────────────────────────────────
    if (analysis.description) {
      drawHeading('About the Detected Condition', GREY_DARK);
      const descH = doc.heightOfString(analysis.description, { width: COL, fontSize: 9.5 });
      ensureSpace(descH + 20);
      doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9.5)
        .text(analysis.description, MARGIN, doc.y, { width: COL, align: 'justify' });
      doc.moveDown(1.2);
    }

    // ── (4) REMEDY CARDS ─────────────────────────────────────────────────────
    const organicItems   = analysis.biological?.length  ? analysis.biological  : ['No biological treatment data available.'];
    const chemicalItems  = analysis.chemical?.length    ? analysis.chemical    : ['No chemical treatment data available.'];
    const preventItems   = analysis.prevention?.length  ? analysis.prevention  : ['No prevention tips available.'];

    drawCard('[ORGANIC / BIOLOGICAL REMEDY]  Natural & Bio-based Treatments', organicItems,  GREEN_LIGHT, GREEN_MID);
    drawCard('[CHEMICAL REMEDY]  Approved Agrochemical Treatments',           chemicalItems, AMBER_BG,    AMBER);
    drawCard('[PREVENTION TIPS]  Proactive Crop Protection Measures',         preventItems,  BLUE_BG,     BLUE);

    // ── (5) OTHER POSSIBLE CONDITIONS ────────────────────────────────────────
    if (analysis.allDiseases && analysis.allDiseases.length > 0) {
      ensureSpace(70);
      drawHeading('Other Possible Conditions (Model Output)', GREY_DARK);
      const tY = doc.y, ROW = 20;
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

    // ── (6) FOOTER ───────────────────────────────────────────────────────────
    drawFooter();
    doc.end();

  } catch (err) {
    console.error('[CropDoctor] PDF error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF generation failed: ' + err.message });
    }
  }
});

module.exports = router;
