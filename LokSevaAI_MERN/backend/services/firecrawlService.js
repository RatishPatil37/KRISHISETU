require("dotenv").config();
const FirecrawlApp = require("@mendable/firecrawl-js").default;

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

async function scrapeSchemes() {
  try {
    const result = await firecrawl.scrape(
      "https://www.myscheme.gov.in/",
      {
        formats: ["markdown"]
      }
    );

    return result;
  } catch (error) {
    console.error("Firecrawl failed:", error);
    throw error;
  }
}

module.exports = scrapeSchemes;