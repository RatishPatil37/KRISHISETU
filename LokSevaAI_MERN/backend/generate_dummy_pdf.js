const fs = require('fs');
const PDFDocument = require('pdfkit');

// Create a document
const doc = new PDFDocument();

// Pipe its output somewhere, like to a file or HTTP response
doc.pipe(fs.createWriteStream('Dummy_Policy.pdf'));

// Embed a font, set the font size, and render some text
doc
  .fontSize(25)
  .text('Maha DBT - Scholarship Scheme', 100, 100);

doc.moveDown();

doc.fontSize(14).text(`This is a dummy government policy document for testing. 

Eligibility:
1. Must be a citizen of India.
2. Must be currently enrolled in an undergraduate program.
3. Family income should be less than Rs. 2 Lakhs per annum.

Benefits:
1. Tuition fee waiver of up to 100%.
2. Monthly stipend of Rs. 1500 for study materials.
3. Free access to online library resources.

How to Apply:
Please visit the official Maha DBT portal to register and submit your documents before the deadline.
`);

// Finalize PDF file
doc.end();

console.log('Dummy_Policy.pdf generated successfully!');
