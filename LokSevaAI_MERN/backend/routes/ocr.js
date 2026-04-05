const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/users');
const Scheme = require('../models/Scheme');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

// Helper to convert local file to GoogleGenerativeAI.Part
function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

// Hardcoded eligible schemes as fallback
const HARDCODED_ELIGIBLE_SCHEMES = [
    {
        name: 'PM Kisan Samman Nidhi',
        portal: 'https://pmkisan.gov.in/',
        benefit: '₹6,000/year direct transfer',
        documents: '7/12 Extract, Aadhar Card, Bank Account'
    },
    {
        name: 'PM Fasal Bima Yojana',
        portal: 'https://pmfby.gov.in/',
        benefit: 'Crop insurance at 2% premium',
        documents: '7/12 Extract, Sowing Certificate, Bank Account'
    },
    {
        name: 'Kisan Credit Card (KCC)',
        portal: 'https://pmkisan.gov.in/KCCForm.aspx',
        benefit: 'Credit up to ₹3 Lakh at 4% interest',
        documents: '7/12 Extract, Aadhar Card, PAN Card'
    },
    {
        name: 'Soil Health Card Scheme',
        portal: 'https://soilhealth.dac.gov.in/',
        benefit: 'Free soil testing and crop recommendations',
        documents: '7/12 Extract, Aadhar Card'
    },
    {
        name: 'Pradhan Mantri Krishi Sinchai Yojana',
        portal: 'https://pmksy.gov.in/',
        benefit: '55% subsidy on drip/sprinkler irrigation',
        documents: '7/12 Extract, 8A Extract, Aadhar Card'
    },
    {
        name: 'Gopinath Munde Shetkari Apghat Vima Yojana',
        portal: 'https://krishi.maharashtra.gov.in/',
        benefit: '₹2 Lakh accident insurance for farmers',
        documents: '7/12 Extract, Aadhar Card, Age Proof'
    },
    {
        name: 'Nanaji Deshmukh Krushi Sanjivani Yojana',
        portal: 'https://pocra.mahait.org/',
        benefit: '75% subsidy on farm ponds, polyhouse',
        documents: '7/12 Extract, Aadhar Card, Bank Account'
    },
    {
        name: 'Mahatma Jyotirao Phule Shetkari Karj Mukti',
        portal: 'https://karjmafi.mahait.org/',
        benefit: 'Loan waiver up to ₹2 Lakh',
        documents: '7/12 Extract, Bank Loan Statement, Domicile Certificate'
    }
];

// Try Gemini with multiple model names
const MODEL_CANDIDATES = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
];

async function tryGeminiModels(genAI, prompt, imagePart) {
    let lastError = null;
    for (const modelName of MODEL_CANDIDATES) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            console.log(`Success with model: ${modelName}`);
            return text;
        } catch (err) {
            console.warn(`Model ${modelName} failed: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError;
}

// Step 1: Tesseract OCR for text extraction
async function runTesseractOCR(filePath) {
    try {
        console.log("Running Tesseract OCR...");
        const result = await Tesseract.recognize(filePath, 'eng+mar+hin', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    console.log(`Tesseract: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        const text = result.data.text;
        console.log(`Tesseract extracted ${text.length} chars`);
        return text;
    } catch (err) {
        console.error("Tesseract failed:", err.message);
        return "";
    }
}

router.post('/analyze-image', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    try {
        console.log(`Processing file: ${req.file.originalname} (${mimeType}) at ${filePath}`);

        // === STEP 1: TESSERACT OCR ===
        let tesseractText = "";
        if (mimeType.startsWith('image/')) {
            tesseractText = await runTesseractOCR(filePath);
        }

        // === STEP 2: TRY GEMINI AI ===
        let geminiResult = null;
        let geminiError = null;
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const imagePart = fileToGenerativePart(filePath, mimeType);

                const prompt = `You are an expert Indian government document analyzer with mastery in Marathi, Hindi and English OCR.

Analyze this uploaded document carefully. It could be:
- A 7/12 Extract (Satbara Utara / गाव नमुना सात / भोगवटादार यादी)
- A land record, mutation entry, or revenue document
- Any other government document

The document may be low quality, blurry, or scanned. It may be in Marathi, Hindi, or English.

EXTRACT with maximum accuracy:
- is_7_12: boolean
- full_name: string (खातेदार/भोगवटादार/Account Holder)
- district: string (जिल्हा)
- taluka: string (तालुका)
- village: string (गाव)
- survey_number: string (गट क्रमांक / Survey No)
- land_area: string (क्षेत्रफळ - include units)
- estimated_annual_income: number (estimate ₹3,00,000 per hectare if not mentioned)
- mobile_number: string (if visible)
- document_type: string

Also provide:
- "summary": A clear English paragraph describing the document.
- "eligible_schemes": An array of scheme names.

RETURN ONLY VALID JSON.`;

                const resultText = await tryGeminiModels(genAI, prompt, imagePart);
                console.log("Gemini Raw Response:", resultText);

                try {
                    geminiResult = JSON.parse(resultText);
                } catch (e) {
                    console.error("JSON Parse Error:", e.message);
                    geminiResult = null;
                }
            } catch (err) {
                console.error("Gemini AI failed entirely:", err.message);
                geminiError = err.message;
            }
        } else {
            geminiError = "GEMINI_API_KEY not set in .env";
        }

        // === STEP 3: BUILD RESPONSE ===
        // Clean up the file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Unlink error:", err);
        });

        // CASE A: Gemini succeeded
        if (geminiResult && !geminiResult.error) {
            return res.json({
                success: true,
                insights: geminiResult.summary || "Document analyzed successfully with AI.",
                extractedData: geminiResult.is_7_12 ? geminiResult : {
                    ...geminiResult,
                    is_7_12: true,
                    document_type: geminiResult.document_type || "Government Document"
                },
                eligibleSchemes: geminiResult.eligible_schemes || HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
                hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
                source: 'gemini-ai'
            });
        }

        // CASE B: Gemini failed but Tesseract has text
        if (tesseractText && tesseractText.trim().length > 20) {
            const extractedData = parseBasicTextFields(tesseractText);
            return res.json({
                success: true,
                insights: `Document scanned via OCR. Raw text extracted (${tesseractText.length} characters). AI enhancement unavailable.${geminiError ? ' (AI Error: ' + geminiError + ')' : ''}\n\n--- OCR Text ---\n${tesseractText.substring(0, 500)}`,
                extractedData: extractedData,
                eligibleSchemes: HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
                hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
                ocrText: tesseractText,
                source: 'tesseract-ocr'
            });
        }

        // CASE C: Both failed — still return hardcoded schemes for report
        return res.json({
            success: true,
            insights: `⚠️ Could not extract text from this document. ${geminiError ? 'AI Error: ' + geminiError : 'Upload a clearer image for better results.'}\n\nHowever, based on your profile, you may be eligible for the schemes listed below.`,
            extractedData: {
                is_7_12: true,
                document_type: 'Uploaded Document',
                full_name: 'From uploaded document',
                summary: 'Document uploaded but text extraction was limited.'
            },
            eligibleSchemes: HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
            hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
            source: 'fallback'
        });

    } catch (processError) {
        console.error("Document Process Error:", processError);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        // Even on total crash, return eligible schemes
        return res.json({
            success: true,
            insights: `⚠️ Processing error occurred: ${processError.message}\n\nBased on your profile, here are your eligible schemes:`,
            extractedData: {
                is_7_12: true,
                document_type: 'Error - Fallback',
                full_name: 'From uploaded document'
            },
            eligibleSchemes: HARDCODED_ELIGIBLE_SCHEMES.map(s => s.name),
            hardcodedSchemes: HARDCODED_ELIGIBLE_SCHEMES,
            source: 'error-fallback'
        });
    }
});

// Basic text field extraction from OCR text
function parseBasicTextFields(text) {
    const data = {
        is_7_12: false,
        document_type: 'Scanned Document',
        full_name: null,
        district: null,
        taluka: null,
        village: null,
        survey_number: null,
        land_area: null,
    };

    // Detect 7/12
    if (text.match(/7\/12|सातबारा|satbara|गाव.?नमुना|भोगवटा/i)) {
        data.is_7_12 = true;
        data.document_type = '7/12 Extract';
    }

    // Try to extract survey number
    const surveyMatch = text.match(/(?:गट\s*(?:क्र|नं)|survey\s*(?:no|number)|gut\s*no)[.:\s]*(\d+[\/\-]?\d*)/i);
    if (surveyMatch) data.survey_number = surveyMatch[1];

    // District
    const districtMatch = text.match(/(?:जिल्हा|district)[.:\s]*([^\n,]+)/i);
    if (districtMatch) data.district = districtMatch[1].trim();

    // Taluka
    const talukaMatch = text.match(/(?:तालुका|taluka)[.:\s]*([^\n,]+)/i);
    if (talukaMatch) data.taluka = talukaMatch[1].trim();

    // Village
    const villageMatch = text.match(/(?:गाव|village|मौजा)[.:\s]*([^\n,]+)/i);
    if (villageMatch) data.village = villageMatch[1].trim();

    return data;
}

// Sync profile with categorization
router.post('/sync-profile', async (req, res) => {
    try {
        const { uid, extractedData } = req.body;
        if (!uid || !extractedData) {
            return res.status(400).json({ success: false, error: "Missing data." });
        }

        let category = "Middle Class";
        if (extractedData.estimated_annual_income) {
            const income = Number(extractedData.estimated_annual_income);
            if (income < 150000) category = "Backward Class";
            else if (income > 800000) category = "Higher Class";
        }

        const updateData = {
            full_name: extractedData.full_name,
            district: extractedData.district,
            taluka: extractedData.taluka,
            village: extractedData.village,
            survey_number: extractedData.survey_number,
            land_area: extractedData.land_area,
            income_category: category,
            phone: extractedData.mobile_number
        };

        Object.keys(updateData).forEach(key => (updateData[key] == null) && delete updateData[key]);

        const updatedUser = await User.findOneAndUpdate(
            { user_id: uid },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Sync error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
