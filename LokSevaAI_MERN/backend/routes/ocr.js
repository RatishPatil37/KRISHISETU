const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { spawn } = require('child_process');
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

    // Combine magic bytes with explicit mimetype and extension check to robustly detect PDFs
    const hasPdfMagic = fileBuffer.length > 4 &&
        fileBuffer[0] === 0x25 &&
        fileBuffer[1] === 0x50 &&
        fileBuffer[2] === 0x44 &&
        fileBuffer[3] === 0x46;

    const isPDF = hasPdfMagic ||
        req.file.mimetype === 'application/pdf' ||
        req.file.originalname.toLowerCase().endsWith('.pdf');

    console.log("File uploaded:", req.file.originalname, "Detected as PDF:", isPDF);

    // Helper timeout wrapper to prevent hanging parsing libraries
    const timeoutPromise = (promise, ms, message) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
        ]);
    };

    try {
        let extractedText = '';

        if (isPDF) {
            // Use isolated child process to avoid pdf-parse hanging the Express event loop
            try {
                extractedText = await new Promise((resolve, reject) => {
                    const workerPath = path.join(__dirname, '../pdf_extract_worker.js');
                    const child = spawn(process.execPath, [workerPath, filePath], { timeout: 20000 });
                    let output = '';
                    let errOutput = '';
                    child.stdout.on('data', d => { output += d.toString(); });
                    child.stderr.on('data', d => { errOutput += d.toString(); });
                    child.on('close', code => {
                        if (code === 0) resolve(output);
                        else reject(new Error('PDF worker failed: ' + errOutput));
                    });
                    child.on('error', reject);
                });
            } catch (err) {
                console.error('PDF child process error:', err.message);
                throw new Error('Failed to extract PDF text: ' + err.message);
            }
        } else {
            // Process Image via OCR
            try {
                const tesseractResult = await timeoutPromise(Tesseract.recognize(filePath, 'eng'), 25000, 'Image OCR timed out');
                extractedText = tesseractResult.data.text;
            } catch (err) {
                console.error('Tesseract Engine error:', err.message);
                throw new Error('Failed to OCR image: ' + err.message);
            }
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
                return res.json({
                    success: true,
                    insights: "⚠️ Gemini API Key not set.\n\n📄 Raw Extracted Text:\n\n" + extractedText
                });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Analyze the following text extracted from a government document (PDF/Image OCR). 
First, try to check whether the uploaded data is legit and satisfies scheme requirements by extracting:
1. Who is eligible for this scheme?
2. What are the key benefits provided?

If the text is not a scheme document, seems absurd, or gives any backend issues regarding scheme requirements, do the following instead:
Summarize the document by reading it and give a clear summary of what is in the pdf/doc.

Extracted Text:
${extractedText}
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const insights = response.text();

            res.json({ success: true, insights });
        } catch (genAiError) {
            // Gemini failed (expired key, quota, network) — still return the raw OCR text so user sees something
            console.error("Gemini AI Error (falling back to raw OCR text):", genAiError?.message || genAiError);
            const fallbackMsg = `⚠️ AI Summary unavailable (Gemini API error: ${genAiError?.message || 'Unknown error'}).\n\nTo get AI summaries, update GEMINI_API_KEY in backend/.env with a valid key from https://aistudio.google.com\n\n──────────────────────────\n📄 Raw Extracted Text (OCR):\n──────────────────────────\n\n${extractedText}`;
            return res.json({ success: true, insights: fallbackMsg });
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
