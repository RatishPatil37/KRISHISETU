const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: 'uploads/' });

router.post('/analyze-image', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    
    // Read the file natively to detect the actual format (robust method)
    const fileBuffer = fs.readFileSync(filePath);
    
    // Check magic bytes for PDF: %PDF- (Hex: 25 50 44 46 2D)
    const isPDF = fileBuffer.length > 4 && 
                  fileBuffer[0] === 0x25 && 
                  fileBuffer[1] === 0x50 && 
                  fileBuffer[2] === 0x44 && 
                  fileBuffer[3] === 0x46;

    console.log("File uploaded:", req.file.originalname, "Detected as PDF:", isPDF);

    try {
        let extractedText = '';

        if (isPDF) {
            // Read PDF and extract text
            const pdfData = fs.readFileSync(filePath);
            const data = await pdfParse(pdfData);
            extractedText = data.text;
        } else {
            // Process Image via OCR
            const tesseractResult = await Tesseract.recognize(filePath, 'eng');
            extractedText = tesseractResult.data.text;
        }

        // Cleanup uploaded file async to prevent EBUSY locks on Windows
        setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') console.error("Error deleting temp file:", err.message);
            });
        }, 1000);

        // Remove whitespace and check if text exists
        if (!extractedText || extractedText.trim().length === 0) {
            return res.json({ success: true, insights: "No text could be extracted from the document. Please try a clearer one." });
        }

        // Summarize with Gemini
        try {
            let apiKey = process.env.GEMINI_API_KEY;
            
            if (!apiKey) {
                 return res.json({ success: true, insights: "Text extracted successfully, but Gemini API Key is missing for insights:\n\n" + extractedText });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            // using gemini-1.5-flash which is universally supported by the legacy v1beta endpoint
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Analyze the following text extracted from a government policy document (PDF/Image OCR). 
Please extract and summarize exactly:
1. Who is eligibility for this scheme?
2. What are the key benefits provided?
If the text is unreadable or not related to a policy, please indicate that.

Extracted Text:
${extractedText}
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const insights = response.text();

            res.json({ success: true, insights });
        } catch (genAiError) {
            console.error("Gemini AI Error:", genAiError);
            res.status(500).json({ success: false, error: 'Failed to generate insights from text.' });
        }
    } catch (processError) {
        console.error("Document Process Error:", processError);
        // Cleanup uploaded file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
        return res.status(500).json({ success: false, error: 'Document processing failed. Please ensure you uploaded a valid image or PDF.' });
    }
});

module.exports = router;
