require("dotenv").config();
const { scrapeSchemes, scrapeNews } = require("./services/firecrawlService");

async function main() {
    try {
        console.log("\n🚀 Testing bulletproof scrapeNews (v2)...");
        const news = await scrapeNews();
        console.log("✅ Success! News articles found:", news.length);
        if (news.length > 0) {
            console.log("First Article:", JSON.stringify(news[0], null, 2));
        }

        console.log("\n🚀 Testing bulletproof scrapeSchemes (v2)...");
        const schemes = await scrapeSchemes();
        console.log("✅ Success! Schemes found:", schemes.length);
        if (schemes.length > 0) {
            console.log("First Scheme:", JSON.stringify(schemes[0], null, 2));
        }
    } catch (e) {
        console.error("❌ TEST FAILED:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
}
main();
