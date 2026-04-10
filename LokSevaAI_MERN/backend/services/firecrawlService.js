require("dotenv").config();
const FirecrawlApp = require("@mendable/firecrawl-js").default;

let firecrawl = null;
try {
  if (process.env.FIRECRAWL_API_KEY && !process.env.FIRECRAWL_API_KEY.includes('YOUR_')) {
    firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  } else {
    console.warn('[Firecrawl] API key not configured — firecrawl features disabled.');
  }
} catch (e) {
  console.warn('[Firecrawl] Could not initialize:', e.message);
}

async function scrapeSchemes() {
  if (!firecrawl) {
    console.warn('[Firecrawl] Skipping scrape — not initialized.');
    return { data: [] };
  }
  try {
    const result = await firecrawl.scrape(
      "https://www.myscheme.gov.in/",
      { formats: ["markdown"] }
    );
    return result;
  } catch (error) {
    console.error("Firecrawl failed:", error);
    throw error;
  }
}

module.exports = scrapeSchemes;