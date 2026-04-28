const express = require("express");
const router = express.Router();

const { scrapeSchemes, scrapeNews, fallbackScrapeSchemes } = require("../services/firecrawlService");
const Scheme = require("../models/Scheme");
const News = require("../models/News");
const User = require("../models/users");
const { sendSchemeWhatsApp } = require("../services/twilioService");

router.get("/sync", async (req, res) => {
  try {
    const { uid } = req.query;
    console.log("-> 🔄 Master Sync Triggered...");

    // 1. Concurrent Fetch (RSS News + Firecrawl Schemes)
    const results = await Promise.allSettled([scrapeSchemes(), scrapeNews()]);
    
    // 2. Process Schemes (Firecrawl)
    let schemesProcessed = 0;
    let schemesExtracted = [];

    if (results[0].status === "fulfilled" && Array.isArray(results[0].value) && results[0].value.length > 0) {
      schemesExtracted = results[0].value;
    } else {
      // 🛡️ TRIGGER PIB FALLBACK IF FIRECRAWL FAILS
      console.log("⚠️ Firecrawl failed or returned empty. Triggering PIB Fallback...");
      schemesExtracted = await fallbackScrapeSchemes();
    }

    // Persist discovered schemes (Firecrawl or Fallback)
    for (const item of schemesExtracted) {
      if (item.scheme_name) {
        await Scheme.findOneAndUpdate(
          { scheme_name: item.scheme_name },
          item,
          { upsert: true, new: true }
        );
        schemesProcessed++;
      }
    }

    // 3. Process News (RSS Hybrid)
    if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
      const extractedNews = results[1].value;
      if (extractedNews.length > 0) {
        await News.deleteMany({});
        await News.insertMany(extractedNews.filter(n => n.title), { ordered: false });
      }
    }

    let allSchemes = await Scheme.find({});
    
    // 🎲 SMART SHUFFLE: Rearrange all schemes for 'Discovery' feel
    for (let i = allSchemes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSchemes[i], allSchemes[j]] = [allSchemes[j], allSchemes[i]];
    }

    const topNews = await News.find({}).sort({ priority: -1, fetched_at: -1 }).limit(10);
    
    // 4. Notification (Non-blocking)
    if (uid) {
      User.findOne({ user_id: uid }).then(u => {
        if (u?.phone) sendSchemeWhatsApp(u, allSchemes.slice(0,5)).catch(e => console.error("Twilio err:", e.message));
      }).catch(e => console.error("User lookup err:", e.message));
    }

    res.json({
      success: true,
      schemes: allSchemes,
      news: topNews,
      db_count: allSchemes.length,
      news_count: topNews.length,
      scraped_count: schemesProcessed,
      gemini_worked: schemesProcessed > 0,
      source: results[0].status === "fulfilled" ? "firecrawl" : "pib_fallback"
    });

  } catch (error) {
    console.error("Critical Sync failure:", error);
    let s = await Scheme.find({});
    // Shuffle even on complete failure fallback
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    const n = await News.find({}).limit(10);
    res.json({ 
      success: true, 
      schemes: s, 
      news: n, 
      db_count: s.length,
      news_count: n.length,
      gemini_worked: false,
      source: "cache_fallback", 
      error: error.message 
    });
  }
});

// Dedicated Fast News Refresh (0 Firecrawl Credits)
router.post("/news/refresh", async (req, res) => {
  try {
    console.log("-> 📰 Fast News Refresh Triggered...");
    const latestNews = await scrapeNews();
    if (latestNews && latestNews.length > 0) {
      await News.deleteMany({});
      await News.insertMany(latestNews.filter(n => n.title), { ordered: false });
    }
    const news = await News.find({}).sort({ priority: -1, fetched_at: -1 }).limit(10);
    res.json({ success: true, news });
  } catch (error) {
    console.error("News refresh failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dedicated endpoint to fetch Taaza Khabar (News) with Pagination
router.get("/news", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await News.countDocuments();
    if (count === 0) {
      const firstSet = await scrapeNews();
      if (firstSet?.length) await News.insertMany(firstSet.filter(n => n.title), { ordered: false });
    }

    const finalNews = await News.find({})
      .sort({ priority: -1, fetched_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await News.countDocuments();
    res.json({ 
      success: true, 
      news: finalNews, 
      hasMore: skip + finalNews.length < totalCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;