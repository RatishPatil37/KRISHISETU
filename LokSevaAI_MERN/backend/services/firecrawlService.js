require("dotenv").config({ silent: true }); // silent: don't crash if no .env file
const FirecrawlApp = require("@mendable/firecrawl-js").default;

// Lazy init: create client on first use, not at require-time
// This prevents crashes when FIRECRAWL_API_KEY comes from OS env (Docker)
let _firecrawl = null;
function getFirecrawl() {
  if (!_firecrawl) {
    _firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY || ''
    });
  }
  return _firecrawl;
}

let apiBlockedUntil = null;

// Helper for exponential backoff retries with Circuit Breaker
const retryOperation = async (operation, maxRetries = 3, delay = 2000) => {
  if (apiBlockedUntil && Date.now() < apiBlockedUntil) {
    const remainingTime = Math.ceil((apiBlockedUntil - Date.now()) / 60000);
    throw new Error(`Firecrawl API temporarily blocked due to quota/auth errors. Try again in ${remainingTime} minutes. Using cache.`);
  }

  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, error.message);
      
      // Circuit Breaker: Stop retrying on Hard Limits (Quota / Auth)
      const errStr = error.message || "";
      if (errStr.includes("Insufficient credits") || errStr.includes("402") || errStr.includes("Unauthorized") || errStr.includes("401")) {
        console.error("Hard API limit encountered. Aborting retries and blocking further requests for 15 minutes.");
        apiBlockedUntil = Date.now() + 15 * 60 * 1000; // Block for 15 mins
        throw error;
      }
      
      lastError = error;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // exponential
    }
  }
  throw lastError;
};

async function scrapeSchemes() {
  const scrapeLogic = async () => {
    console.log("-> Triggering Firecrawl v2 Extract (Schemes)...");
    const result = await getFirecrawl().extract({
      urls: ["https://www.myscheme.gov.in/"],
      prompt: "Extract the list of all available government schemes presented on the page including their names, summaries, and categories.",
      schema: {
        type: "object",
        properties: {
          schemes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scheme_name: { type: "string" },
                summary: { type: "string" },
                category: { type: "string" },
                eligibility_score: { type: "number" }
              },
              required: ["scheme_name"]
            }
          }
        },
        required: ["schemes"]
      }
    });
    
    if (!result.success) {
      console.error("FIRECRAWL EXTRACT FAILED:", JSON.stringify(result, null, 2));
      throw new Error(`Firecrawl extraction failed: ${result.error || "Unknown Error"}`);
    }
    
    const schemes = result.data?.schemes || [];
    console.log(`✅ Extracted ${schemes.length} schemes.`);
    return schemes;
  };

  return await retryOperation(scrapeLogic);
}

async function scrapeNews() {
  try {
    console.log("-> Triggering Hybrid RSS Extract (News)...");
    
    // We use a unified news aggregator for Taaza Khabar. 
    // This bypasses Firecrawl limits, saves AI credits, and pulls from multiple major sources instantly.
    const axios = require('axios');
    const cheerio = require('cheerio');
    
    const response = await axios.get('https://news.google.com/rss/search?q=agriculture+farming+schemes+india&hl=en-IN&gl=IN&ceid=IN:en');
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    const news = [];
    const seenTitles = new Set();
    
    // Curated high-res agriculture stock photos from Unsplash
    const stockImages = [
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop", // Tractor
      "https://images.unsplash.com/photo-1592982537447-6f2ae82aa21e?q=80&w=600&auto=format&fit=crop", // Green crops
      "https://images.unsplash.com/photo-1586771107445-d3af9e1e3e7a?q=80&w=600&auto=format&fit=crop", // Rural India
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=600&auto=format&fit=crop", // Harvesting
      "https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=600&auto=format&fit=crop", // Fields
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600&auto=format&fit=crop", // Golden Wheat
      "https://images.unsplash.com/photo-1558904541-efa843a96f09?q=80&w=600&auto=format&fit=crop"  // Planting
    ];
    
    // Fetch up to 100 to allow room for filtering duplicates
    $('item').slice(0, 100).each((index, element) => {
      const title = $(element).find('title').text()?.trim() || "Agri News Update";
      
      // DE-DUPLICATION LOGIC: Skip if title already seen in this batch
      if (seenTitles.has(title)) return;
      seenTitles.add(title);

      let link = $(element).find('link').text() || "#";
      const sourceStr = $(element).find('source').text() || "Agriculture Portal";
      const pubDate = $(element).find('pubDate').text();
      
      const hash = title.length > 0 ? title.charCodeAt(0) + title.charCodeAt(title.length - 1) : 0;
      const imageUrl = stockImages[hash % stockImages.length];
      
      news.push({
        title: title,
        summary: `Latest priority update from ${sourceStr}`,
        link: link,
        image_url: imageUrl,
        source: sourceStr,
        published_date: pubDate ? new Date(pubDate).toLocaleDateString('en-IN') : "Today",
        priority: 100 - news.length
      });
    });
    
    // Fisher-Yates Shuffle to provide a 'Dynamic Feel' every time refresh is clicked
    for (let i = news.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [news[i], news[j]] = [news[j], news[i]];
    }

    // Re-assign priorities based on new shuffled order
    news.forEach((item, idx) => {
      item.priority = news.length - idx;
    });
    
    console.log(`✅ Extracted ${news.length} UNIQUE news articles and SHUFFLED for dynamic UX.`);
    return news;
  } catch (error) {
    console.error("HYBRID SEARCH FAILED (News):", error.message);
    return []; // Return empty instead of throwing to prevent 500
  }
}

/**
 * 0-Cost Fallback: Scrape PIB (Press Information Bureau) for new scheme announcements
 */
async function fallbackScrapeSchemes() {
  try {
    console.log("-> 🛡️ Triggering PIB Fallback (Schemes)...");
    // PIB search for 'scheme'
    const pibUrl = "https://pib.gov.in/RssSearch.aspx?search=scheme";
    const response = await axios.get(pibUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const fallbackSchemes = [];

    $('item').slice(0, 15).each((index, element) => {
      const title = $(element).find('title').text()?.trim() || "New Government Initiative";
      const link = $(element).find('link').text() || "#";
      const description = $(element).find('description').text()?.replace(/<[^>]*>?/gm, '').trim() || "Details coming soon...";
      
      fallbackSchemes.push({
        scheme_name: title,
        summary: description.substring(0, 200) + "...",
        category: "Central Government",
        state: "All India",
        income_level: "All",
        benefit_type: "Social Welfare",
        eligibility_score: 75,
        is_active: true,
        source_url: link
      });
    });

    console.log(`✅ PIB Fallback: Discovered ${fallbackSchemes.length} potential new schemes.`);
    return fallbackSchemes;
  } catch (error) {
    console.error("PIB Fallback failed:", error.message);
    return [];
  }
}

module.exports = { 
  scrapeSchemes, 
  scrapeNews,
  fallbackScrapeSchemes 
};