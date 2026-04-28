const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/users');

// ── Upload directory ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Accept ALL common document types
const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
});

// ── Hardcoded eligible schemes (always shown as fallback) ────────
const HARDCODED_ELIGIBLE_SCHEMES = [
    { name: 'PM Kisan Samman Nidhi', portal: 'https://pmkisan.gov.in/', benefit: '₹6,000/year direct transfer', documents: '7/12 Extract, Aadhar Card, Bank Account' },
    { name: 'PM Fasal Bima Yojana', portal: 'https://pmfby.gov.in/', benefit: 'Crop insurance at 2% premium', documents: '7/12 Extract, Sowing Certificate, Bank Account' },
    { name: 'Kisan Credit Card (KCC)', portal: 'https://pmkisan.gov.in/KCCForm.aspx', benefit: 'Credit up to ₹3 Lakh at 4% interest', documents: '7/12 Extract, Aadhar Card, PAN Card' },
    { name: 'Soil Health Card Scheme', portal: 'https://soilhealth.dac.gov.in/', benefit: 'Free soil testing & crop recommendations', documents: '7/12 Extract, Aadhar Card' },
    { name: 'PM Krishi Sinchai Yojana', portal: 'https://pmksy.gov.in/', benefit: '55% subsidy on drip/sprinkler irrigation', documents: '7/12 Extract, 8A Extract, Aadhar Card' },
    { name: 'Gopinath Munde Shetkari Vima Yojana', portal: 'https://krishi.maharashtra.gov.in/', benefit: '₹2 Lakh accident insurance', documents: '7/12 Extract, Aadhar Card, Age Proof' },
    { name: 'Nanaji Deshmukh Krushi Sanjivani', portal: 'https://pocra.mahait.org/', benefit: '75% subsidy on farm ponds', documents: '7/12 Extract, Aadhar Card, Bank Account' },
    { name: 'Shetkari Karj Mukti Yojana', portal: 'https://karjmafi.mahait.org/', benefit: 'Loan waiver up to ₹2 Lakh', documents: '7/12, Bank Statement, Domicile Cert' },
];

// ── Helper: file to Gemini inline data ──────────────────────────
function fileToGenerativePart(filePath, mimeType) {
    return { inlineData: { data: fs.readFileSync(filePath).toString('base64'), mimeType } };
}

// ── STEP 1A: Google Cloud Vision API (REST) — Images ────────────
async function runGoogleVisionOCR(filePath) {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) return null;
    try {
        console.log('▶ Google Vision OCR...');
        const imageBase64 = fs.readFileSync(filePath).toString('base64');
        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            { requests: [{ image: { content: imageBase64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] },
            { timeout: 10000 }
        );
        // Check for billing/API errors in response body
        const apiError = response.data.responses?.[0]?.error;
        if (apiError) {
            console.warn('Vision API response error:', apiError.message);
            return null;
        }
        const text = response.data.responses[0]?.fullTextAnnotation?.text || '';
        console.log(`✅ Google Vision: ${text.length} chars`);
        return text.trim() || null;
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message || '';
        // Billing not enabled — don't spam logs, just skip
        if (msg.includes('billing') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
            console.warn('⚠️  Google Vision skipped (billing/key issue). Using Tesseract instead.');
        } else {
            console.error('Vision OCR error:', msg);
        }
        return null;
    }
}

// ── STEP 1B: pdf-parse — Digital PDFs ───────────────────────────
async function extractPdfText(filePath) {
    try {
        console.log('▶ PDF text extraction (pdf-parse)...');
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(filePath);
        const result = await pdfParse(buffer);
        const text = result.text?.trim();
        console.log(`✅ PDF-Parse: ${text?.length || 0} chars`);
        return (text && text.length > 30) ? text : null;
    } catch (err) {
        console.error('pdf-parse error:', err.message);
        return null;
    }
}

// ── STEP 1C: mammoth — DOCX/Word files ──────────────────────────
async function extractDocxText(filePath) {
    try {
        console.log('▶ DOCX text extraction (mammoth)...');
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value?.trim();
        console.log(`✅ Mammoth: ${text?.length || 0} chars`);
        return (text && text.length > 30) ? text : null;
    } catch (err) {
        console.error('Mammoth error:', err.message);
        return null;
    }
}

// ── STEP 1D: Tesseract — Primary offline OCR for images ──────────
async function runTesseractOCR(filePath) {
    try {
        console.log('▶ Tesseract OCR (primary offline engine)...');
        const result = await Tesseract.recognize(filePath, 'eng+mar+hin', {
            logger: m => { if (m.status === 'recognizing text') process.stdout.write(`\r   Tesseract: ${Math.round(m.progress * 100)}%`); }
        });
        process.stdout.write('\n');
        const text = result.data.text?.trim();
        console.log(`✅ Tesseract: ${text?.length || 0} chars extracted`);
        return (text && text.length > 20) ? text : null;
    } catch (err) {
        console.error('Tesseract error:', err.message);
        return null;
    }
}

// ── STEP 2: Gemini — Structured extraction ───────────────────────
// gemini-2.0-flash-lite has higher free quota; gemini-1.5-flash-latest is v1beta stable
const MODEL_CHAIN = ['gemini-2.0-flash-lite', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];

async function runGeminiStructuring(genAI, imagePart, rawOcrText) {
    const ocrSection = rawOcrText
        ? `\n\n=== RAW OCR TEXT (use this for precision) ===\n${rawOcrText.substring(0, 4000)}\n=== END OCR TEXT ===\n`
        : '';

    const prompt = `You are a world-class Indian government document analyst and OCR specialist.
Carefully analyze the provided document. It may be a 7/12 Extract (Satbara), income certificate, Aadhar, ration card, or any govt document.
Languages can be Marathi, Hindi, or English — handle all three.
${ocrSection}
Your job: Extract ALL fields below. Even if a field isn't labeled explicitly, INFER it from context (e.g., the first bold name at top of a 7/12 is usually the account holder).

Return ONLY this JSON (no markdown, no code fences):
{
  "is_7_12": boolean,
  "document_type": "string (e.g. 7/12 Extract, Income Certificate, Aadhar Card)",
  "full_name": "string — REQUIRED. The primary person's name. Look for 'खातेदार', 'भोगवटादार', 'Name', the first person listed",
  "district": "string — from जिल्हा / District field",
  "taluka": "string — from तालुका / Taluka field",
  "village": "string — from गाव / Village / मौजा field",
  "survey_number": "string — गट क्र. / Survey No. / Gut No.",
  "land_area": "string — क्षेत्रफळ / Total Area with units",
  "estimated_annual_income": number (estimate ₹3,00,000 per hectare if unknown),
  "mobile_number": "string or null",
  "summary": "2-3 sentence English summary of what this document shows",
  "eligible_schemes": ["scheme name 1", "scheme name 2"]
}

CRITICAL: full_name must NEVER be null or 'Unknown'. If it can't be found from labeled fields, take the first human name visible in the document.`;

    let lastErr = null;
    for (const model of MODEL_CHAIN) {
        try {
            console.log(`▶ Gemini model: ${model}`);
            const m = genAI.getGenerativeModel({ model, generationConfig: { responseMimeType: 'application/json' } });
            const parts = imagePart ? [prompt, imagePart] : [prompt];
            const result = await m.generateContent(parts);
            const text = result.response.text();
            console.log(`✅ Gemini (${model}) responded`);
            // Clean JSON (strip any accidental markdown)
            const cleaned = text.replace(/```json|```/gi, '').trim();
            return JSON.parse(cleaned);
        } catch (err) {
            console.warn(`✗ ${model}: ${err.message}`);
            lastErr = err;
        }
    }
    throw lastErr;
}

// ── Main route ───────────────────────────────────────────────────
router.post('/analyze-image', upload.single('document'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname || '';
    const safeUnlink = () => { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {} };

    console.log(`\n==============================`);
    console.log(`📄 File: ${originalName} | MIME: ${mimeType}`);
    console.log(`==============================`);

    try {
        const isImage = mimeType.startsWith('image/');
        const isPdf = mimeType === 'application/pdf';
        const isDocx = mimeType.includes('wordprocessingml') || mimeType === 'application/msword' || originalName.match(/\.docx?$/i);
        const geminiApiKey = process.env.GEMINI_API_KEY;

        // ── Phase 1+2: Parallel extraction where possible ──────────
        let rawOcrText = null;
        let ocrSource = 'none';
        let geminiResult = null;

        if (isImage) {
            // Phase 1: Run Tesseract (always works, offline) + Vision in parallel
            const [tesseractText, visionText] = await Promise.all([
                runTesseractOCR(filePath),
                runGoogleVisionOCR(filePath),   // May return null if billing not enabled
            ]);
            // Prefer Vision (more accurate) if it returned results, else use Tesseract
            rawOcrText = visionText || tesseractText;
            ocrSource = visionText ? 'google-vision' : (tesseractText ? 'tesseract' : 'none');
            console.log(`📝 OCR source chosen: ${ocrSource} (${rawOcrText?.length || 0} chars)`);

            // Phase 2: Send to Gemini with both raw text and image
            if (geminiApiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const imagePart = fileToGenerativePart(filePath, mimeType);
                    geminiResult = await runGeminiStructuring(genAI, imagePart, rawOcrText);
                } catch (err) {
                    const errMsg = err.message || '';
                    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
                        console.warn('⚠️  Gemini quota exceeded — using Tesseract text directly');
                    } else {
                        console.error('Gemini failed for image:', errMsg);
                    }
                }
            }
        } else if (isPdf) {
            rawOcrText = await extractPdfText(filePath);
            ocrSource = rawOcrText ? 'pdf-parse' : 'none';
            if (geminiApiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    // For scanned PDFs with no extracted text, pass the PDF directly to Gemini Vision
                    const imagePart = !rawOcrText ? fileToGenerativePart(filePath, 'application/pdf') : null;
                    geminiResult = await runGeminiStructuring(genAI, imagePart, rawOcrText);
                } catch (err) {
                    const errMsg = err.message || '';
                    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
                        console.warn('⚠️  Gemini quota exceeded — using pdf-parse text directly');
                    } else {
                        console.error('Gemini failed for PDF:', errMsg);
                    }
                }
            }
        } else if (isDocx) {
            rawOcrText = await extractDocxText(filePath);
            ocrSource = rawOcrText ? 'mammoth' : 'none';
            if (geminiApiKey && rawOcrText) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    geminiResult = await runGeminiStructuring(genAI, null, rawOcrText);
                } catch (err) {
                    const errMsg = err.message || '';
                    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
                        console.warn('⚠️  Gemini quota exceeded — using mammoth text directly');
                    } else {
                        console.error('Gemini failed for DOCX:', errMsg);
                    }
                }
            }
        }

        safeUnlink();

        // ── Phase 3: Build response ─────────────────────────────
        if (geminiResult) {
            // Ensure full_name is never "Unknown" or null
            if (!geminiResult.full_name || geminiResult.full_name.toLowerCase() === 'unknown' || geminiResult.full_name.toLowerCase() === 'null') {
                geminiResult.full_name = rawOcrText ? extractNameFromText(rawOcrText) : 'See document';
            }

            return res.json({
                success: true,
                insights: geminiResult.summary || 'Document analyzed successfully.',
                extractedData: { ...geminiResult, document_source: ocrSource },
                eligibleSchemes: geminiResult.eligible_schemes?.length ? geminiResult.eligible_schemes : HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
                hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
                source: `gemini+${ocrSource}`,
            });
        }

        // ── Phase 4: Text-only fallback ─────────────────────────
        if (rawOcrText) {
            const basicData = parseBasicTextFields(rawOcrText);
            return res.json({
                success: true,
                insights: `Document scanned. Raw text extracted (${rawOcrText.length} chars). AI structuring unavailable.`,
                extractedData: { ...basicData, document_source: ocrSource },
                eligibleSchemes: HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
                hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
                source: ocrSource,
            });
        }

        // ── Phase 5: Complete fallback — always return schemes ──
        let fallbackMessage = '⚠️ Could not extract text from this document. Showing general scheme recommendations based on your profile.';
        if (isPdf) {
            fallbackMessage = '⚠️ AI processing quota hit. For scanned PDFs without text, please upload as an image (JPG/PNG) instead so we can use Tesseract/Vision OCR directly.';
        }

        return res.json({
            success: true,
            insights: fallbackMessage,
            extractedData: { is_7_12: false, document_type: isPdf ? 'Unsupported PDF' : 'Uploaded Document', full_name: 'Unknown User' },
            eligibleSchemes: HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
            hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
            source: 'fallback',
        });


    } catch (err) {
        safeUnlink();
        console.error('Fatal route error:', err);
        return res.json({
            success: true,
            insights: `⚠️ Processing error: ${err.message}. Showing general recommendations.`,
            extractedData: { is_7_12: false, full_name: null },
            eligibleSchemes: HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
            hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
            source: 'error-fallback',
        });
    }
});

// ── Helper: better name extraction from raw text ─────────────────
function extractNameFromText(text) {
    const lines = text.split('\n');
    const patterns = [
        /(?:name|नाव|नाम|खातेदार|भोगवटादार|श्री\.|श्रीमती|Mr\.|Mrs\.|Ms\.)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,40})/i
    ];
    for (const line of lines) {
        for (const p of patterns) {
            const m = line.match(p);
            // Need >3 chars and ignore if it contains another label
            if (m && m[1] && m[1].trim().length > 3 && !/गट|गाव|क्षेत्र|survey|taluka/i.test(m[1])) {
                return m[1].replace(/[\n\r]/g, '').trim().substring(0, 50);
            }
        }
    }
    // Fallback: literally just look for any sequence of words on the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const l = lines[i].trim();
        if (l.length > 5 && l.length < 40 && !/:|-|[0-9]/.test(l)) return l;
    }
    return null;
}

// ── Helper: regex-based field parsing ────────────────────────────
function parseBasicTextFields(text) {
    const data = { is_7_12: false, document_type: 'Scanned Document', full_name: null, district: null, taluka: null, village: null, survey_number: null, land_area: null };
    if (/7\/12|सातबारा|satbara|गाव.?नमुना|भोगवटा|७\/१२/i.test(text)) { data.is_7_12 = true; data.document_type = '7/12 Extract'; }
    data.full_name = extractNameFromText(text) || 'Unknown User';
    
    // Make regex extremely lenient with spacing and dashes
    const sm = text.match(/(?:गट\s*(?:क्र|नं)|survey\s*(?:no|number)|gut\s*no)[\s.:\-]*(\d+[\/\-]?\d*)/i);
    if (sm) data.survey_number = sm[1];
    
    // Look for word characters (Eng or Marathi)
    const dm = text.match(/(?:जिल्हा|district|dist)[\s.:\-]*([A-Za-z\u0900-\u097F]{3,20})/i);
    if (dm) data.district = dm[1].trim();
    
    const tm = text.match(/(?:तालुका|taluka|tal|ता\.)[\s.:\-]*([A-Za-z\u0900-\u097F]{3,20})/i);
    if (tm) data.taluka = tm[1].trim();
    
    const vm = text.match(/(?:गाव|village|मौजा)[\s.:\-]*([A-Za-z\u0900-\u097F]{3,20})/i);
    if (vm) data.village = vm[1].trim();
    
    const am = text.match(/(?:क्षेत्रफळ|area|hectare|एकूण\s*क्षेत्र)[\s.:\-]*([\d.]+\s*(?:H|ha|hectare|R|Ar|guntha)?)/i);
    if (am) data.land_area = am[1].trim();
    return data;
}

// ── Sync to profile route ─────────────────────────────────────────
router.post('/sync-profile', async (req, res) => {
    const { uid, extractedData } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'Missing uid.' });
    if (!extractedData) return res.status(400).json({ success: false, error: 'Missing extractedData.' });

    try {
        let income_category = 'Middle Class';
        if (extractedData.estimated_annual_income) {
            const inc = Number(extractedData.estimated_annual_income);
            if (inc < 150000) income_category = 'Backward Class';
            else if (inc > 800000) income_category = 'Higher Class';
        }

        const update = {
            full_name: extractedData.full_name || undefined,
            district:  extractedData.district  || undefined,
            taluka:    extractedData.taluka     || undefined,
            village:   extractedData.village    || undefined,
            survey_number: extractedData.survey_number || undefined,
            land_area: extractedData.land_area  || undefined,
            income_category,
            phone: extractedData.mobile_number  || undefined,
        };
        // Strip undefined
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

        const updatedUser = await User.findOneAndUpdate(
            { user_id: uid },
            { $set: update },
            { new: true, upsert: true, maxTimeMS: 10000 } // 10s DB timeout
        );
        return res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Sync error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
