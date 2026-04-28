const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const { processSMSQuery } = require("../services/geminiService");
const Scheme = require("../models/Scheme");

const { MessagingResponse } = twilio.twiml;

// In-memory session store: tracks state per phone number
const sessions = {};

// ─── Channel-Aware Message Templates ─────────────────────────────────────────
// isWhatsApp: true  → emoji + bold (*text*)  → for smartphones
// isWhatsApp: false → plain ASCII only       → for basic/feature phones
function getMainMenu(isWhatsApp) {
  if (isWhatsApp) {
    return `🌾 *KrishiSetu Helpline*\n\nNamaste! Reply with a number:\n\n*1* - 🏛️ Farmer Schemes\n*2* - 💰 Mandi Prices\n*3* - ☁️ Weather Update\n*4* - ❓ Ask a Question\n*0* - Main Menu`;
  }
  return `KRISHISETU HELPLINE\n\nReply with:\n1 - Farmer Schemes\n2 - Mandi Prices\n3 - Weather Update\n4 - Ask a Question\n0 - Show Menu Again`;
}

function formatSchemes(schemes, isWhatsApp) {
  if (schemes.length === 0) {
    return isWhatsApp
      ? "😔 No schemes in database yet. Please try again later!\n\nReply *0* for Menu."
      : "No schemes available yet. Please try again soon.\nReply 0 for Menu.";
  }

  const list = schemes.map((s, i) => {
    const name = s.scheme_name || "Unknown Scheme";
    const desc = s.summary || s.benefits || "";
    if (isWhatsApp) {
      return `*${i + 1}. ${name}*\n   ${desc}`;
    }
    return `${i + 1}. ${name}\n   ${desc}`;
  }).join("\n\n");

  const footer = isWhatsApp
    ? "\n\nFor details: myscheme.gov.in\nReply *0* for Menu."
    : "\n\nFor details: myscheme.gov.in\nReply 0 for Menu.";

  const header = isWhatsApp ? "📋 *Active Farmer Schemes:*\n\n" : "ACTIVE FARMER SCHEMES:\n\n";

  return header + list + footer;
}

// ─── Main Webhook ─────────────────────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  const incomingMsg = (req.body.Body || "").trim();
  const fromNumber = req.body.From || "";

  // Detect channel: WhatsApp numbers start with "whatsapp:"
  const isWhatsApp = fromNumber.toLowerCase().startsWith("whatsapp:");
  const channel = isWhatsApp ? "WhatsApp" : "SMS";

  console.log(`📱 [${channel}] from ${fromNumber}: "${incomingMsg}"`);

  const twiml = new MessagingResponse();
  let replyText = "";

  try {
    const session = sessions[fromNumber] || { state: "IDLE" };
    const msgLower = incomingMsg.toLowerCase();

    // ── Awaiting a free-text question ──────────────────────────────────────
    if (session.state === "AWAITING_QUERY") {
      const activeSchemes = await Scheme.find().limit(5);
      let aiReply = await processSMSQuery(incomingMsg, activeSchemes);

      // Strip emojis/markdown for plain SMS
      if (!isWhatsApp) {
        aiReply = aiReply.replace(/[\u{1F000}-\u{1FFFF}]/gu, "").replace(/\*(.+?)\*/g, "$1").trim();
      }

      replyText = aiReply + (isWhatsApp ? "\n\nReply *0* for Menu." : "\nReply 0 for Menu.");
      sessions[fromNumber] = { state: "IDLE" };

    // ── Selection: Farmer Schemes ──────────────────────────────────────────
    } else if (incomingMsg === "1") {
      const schemes = await Scheme.find({ category: { $regex: /farmer/i } }).limit(3);
      const finalSchemes = schemes.length > 0 ? schemes : await Scheme.find().limit(3);
      replyText = formatSchemes(finalSchemes, isWhatsApp);
      sessions[fromNumber] = { state: "IDLE" };

    // ── Selection: Mandi Prices ────────────────────────────────────────────
    } else if (incomingMsg === "2") {
      const mandiQuery = "What are today's mandi market prices for wheat, rice, onion, and tomato in Maharashtra? Give short plain text answer.";
      let reply = await processSMSQuery(mandiQuery, []);
      if (!isWhatsApp) {
        reply = reply.replace(/[\u{1F000}-\u{1FFFF}]/gu, "").replace(/\*(.+?)\*/g, "$1").trim();
      }
      replyText = reply + (isWhatsApp ? "\n\nReply *0* for Menu." : "\nReply 0 for Menu.");
      sessions[fromNumber] = { state: "IDLE" };

    // ── Selection: Weather ─────────────────────────────────────────────────
    } else if (incomingMsg === "3") {
      const weatherQuery = "Give a very short farming weather forecast for Maharashtra today. Plain simple text.";
      let reply = await processSMSQuery(weatherQuery, []);
      if (!isWhatsApp) {
        reply = reply.replace(/[\u{1F000}-\u{1FFFF}]/gu, "").replace(/\*(.+?)\*/g, "$1").trim();
      }
      replyText = reply + (isWhatsApp ? "\n\nReply *0* for Menu." : "\nReply 0 for Menu.");
      sessions[fromNumber] = { state: "IDLE" };

    // ── Selection: Ask a Question ──────────────────────────────────────────
    } else if (incomingMsg === "4") {
      replyText = isWhatsApp
        ? "💬 Type your question now!\n\nExample: \"Am I eligible for PM-Kisan?\"\nExample: \"Documents needed for Fasal Bima?\""
        : "Type your question now.\n\nExample: Am I eligible for PM-Kisan?\nExample: Documents needed for Fasal Bima?";
      sessions[fromNumber] = { state: "AWAITING_QUERY" };

    // ── Menu / Greeting triggers ───────────────────────────────────────────
    } else if (
      incomingMsg === "0" ||
      ["menu", "hi", "hello", "namaste", "start", "help", "jai kisan"].includes(msgLower)
    ) {
      replyText = getMainMenu(isWhatsApp);
      sessions[fromNumber] = { state: "IDLE" };

    // ── Unknown input ──────────────────────────────────────────────────────
    } else {
      const prefix = isWhatsApp ? "❓ Not understood.\n\n" : "Not understood.\n";
      replyText = prefix + getMainMenu(isWhatsApp);
      sessions[fromNumber] = { state: "IDLE" };
    }

  } catch (error) {
    console.error("Error processing webhook:", error);
    replyText = isWhatsApp
      ? "KrishiSetu: Something went wrong. Reply *0* to try again."
      : "KrishiSetu: Error. Reply 0 to try again.";
  }

  twiml.message(replyText);
  res.type("text/xml");
  res.send(twiml.toString());
});

module.exports = router;
