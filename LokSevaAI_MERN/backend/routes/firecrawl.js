const express = require("express");
const router = express.Router();

const scrapeSchemes = require("../services/firecrawlService");
const Scheme = require("../models/Scheme");
const User = require("../models/users");
const { sendSchemeWhatsApp } = require("../services/twilioService");

router.get("/sync", async (req, res) => {
  try {
    const { uid } = req.query;

    console.log("1. Starting scrape...");
    const data = await scrapeSchemes();
    console.log("2. Scrape done");

    // ── Step 3-5: Gemini parse + save (non-fatal) ──────────
    try {
      const { parseSchemesFromMarkdown } = require("../services/geminiService");

      let markdownContent = '';
      if (data && data.data && data.data.markdown) {
        markdownContent = data.data.markdown;
      } else if (typeof data === 'string') {
        markdownContent = data;
      } else if (data && data.markdown) {
        markdownContent = data.markdown;
      } else {
        markdownContent = JSON.stringify(data);
      }

      console.log("3. Calling Gemini...");
      const schemes = await parseSchemesFromMarkdown(markdownContent);
      console.log("4. Gemini done, schemes:", schemes.length);

      for (const schemeData of schemes) {
        const existing = await Scheme.findOne({ scheme_name: schemeData.scheme_name });
        if (!existing) await new Scheme(schemeData).save();
      }
      console.log("5. DB save done");
    } catch (geminiErr) {
      console.warn("Gemini skipped (using existing DB schemes):", geminiErr.message.split('\n')[0]);
    }

    // ── Step 6: Fetch all schemes from DB ─────────────────
    const allSchemes = await Scheme.find({});
    console.log("6. Sending", allSchemes.length, "schemes");

    // ── Step 7: WhatsApp notification ─────────────────────
    if (uid) {
      try {
        const userProfile = await User.findOne({ user_id: uid });
        console.log("7. User profile found:", userProfile?.full_name, "| phone:", userProfile?.phone);

        if (userProfile?.phone) {
          const topSchemes = [...allSchemes]
            .sort((a, b) => (b.eligibility_score || 0) - (a.eligibility_score || 0))
            .slice(0, 5);

          await sendSchemeWhatsApp(userProfile, topSchemes);
          console.log("7. WhatsApp sent to", userProfile.phone);
        } else {
          console.log("7. No phone found for uid:", uid);
        }
      } catch (twilioErr) {
        console.error("WhatsApp send failed:", twilioErr.message);
      }
    } else {
      console.log("7. No uid provided, skipping WhatsApp");
    }

    res.json({ success: true, schemes: allSchemes });

  } catch (error) {
    console.error("Firecrawl error:", error);
    res.status(500).json({ error: "Scraping failed", details: error.message });
  }
});

module.exports = router;