//require("dotenv").config();
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN);

/**
 * Send a WhatsApp message to a user listing their eligible schemes.
 * @param {Object} userProfile  - MongoDB user doc (needs .phone, .full_name)
 * @param {Array}  schemes      - Array of scheme objects
 */
async function sendSchemeWhatsApp(userProfile, schemes) {
  const firstName = (userProfile.full_name || "there").split(" ")[0];

  // Build scheme list
  const schemeLines = schemes.map((s, i) => {
    const score = s.eligibility_score ? ` (${s.eligibility_score}% match)` : "";
    return `${i + 1}. *${s.scheme_name}*${score}\n   ${s.summary || ""}`;
  }).join("\n\n");

  const body = [
    `🏛️ *LOKSEVA — Scheme Update for ${firstName}*`,
    ``,
    `Here are your top eligible government schemes:`,
    ``,
    schemeLines,
    ``,
    `Visit LOKSEVA to apply and learn more.`,
    `_Powered by Firecrawl · Gemini · LangGraph_`,
  ].join("\n");

  // Normalize phone — handle Indian numbers (+91, 91, 0, or 10-digit)
  let digits = userProfile.phone.replace(/\D/g, ""); // remove all non-digits
  let phone = "";

  if (digits.length === 10) {
    phone = "+91" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    phone = "+91" + digits.substring(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    phone = "+" + digits;
  } else {
    // Fallback for other formats
    phone = digits.startsWith("+") ? digits : "+" + digits;
  }

  console.log(`Sending WhatsApp to: ${phone} (Original: ${userProfile.phone})`);

  const message = await client.messages.create({
    body,
    from: "whatsapp:+14155238886",
    to: `whatsapp:${phone}`,
  });

  console.log("Twilio message SID:", message.sid);
  return message;
}

module.exports = { sendSchemeWhatsApp };