const cron = require('node-cron');
const { scrapeNews } = require('./firecrawlService');
const News = require('../models/News');

function initCronJobs() {
  console.log("🕒 Initializing Background Scraper Jobs (node-cron)");

  // Run every 30 minutes (minute 0 and 30)
  cron.schedule('0,30 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] 🕒 Cron Job Triggered: Background News Scrape...`);
    try {
      const extractedNews = await scrapeNews();
      
      if (extractedNews && extractedNews.length > 0) {
        // Clear old news and repopulate to emulate a fast, clean "feed" table
        await News.deleteMany({});
        // ordered: false ensures that if one duplicate title sneaks in, 
        // it skips it and continues with the other 49+ items.
        await News.insertMany(extractedNews, { ordered: false });
        console.log(`[${new Date().toISOString()}] ✅ Cron Job Success: Seeded ${extractedNews.length} articles to DB.`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Cron Job Error (News):`, error.message);
    }
  });

  console.log("🕒 Scheduled 'Background News Scrape' to run every 30 minutes.");
}

module.exports = { initCronJobs };
