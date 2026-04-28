const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const Scheme = require("../models/Scheme");
require("dotenv").config();

const { VoiceResponse } = twilio.twiml;

// Initialize Twilio client to send follow-up SMS
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Twilio Voice locales to define text-to-speech pronunciation
const voices = {
  "mr": "mr-IN", // Marathi
  "hi": "hi-IN", // Hindi
  "en": "en-IN", // English
};

// Helper to build absolute URL from request
function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// 1. WELCOME ROUTE - Language Selection
router.post("/welcome", (req, res) => {
  const twiml = new VoiceResponse();
  const fromNumber = req.body.From;
  const baseUrl = getBaseUrl(req);
  console.log(`📞 Incoming call from ${fromNumber} | base: ${baseUrl}`);

  // Create a <Gather> menu that waits for the user to press a key
  const gather = twiml.gather({
    numDigits: 1,
    action: `${baseUrl}/api/voice/language`,
    method: "POST",
    timeout: 8
  });

  // Welcome message in multiple languages asking to set preference
  gather.say({ language: voices["mr"] }, "कृषी सेतू मध्ये आपले स्वागत आहे. मराठीसाठी १ दाबा.");
  gather.say({ language: voices["hi"] }, "कृषि सेतु में आपका स्वागत है। हिंदी के लिए २ दबाएं।");
  gather.say({ language: voices["en"] }, "Welcome to KrishiSetu. Press 3 for English.");

  // If the user doesn't press anything inside the timeout, repeat menu
  twiml.redirect(`${baseUrl}/api/voice/welcome`);

  res.type("text/xml");
  res.send(twiml.toString());
});

// 2. LANGUAGE CHOSEN - Main Menu
router.post("/language", (req, res) => {
  const digit = req.body.Digits;
  const twiml = new VoiceResponse();
  const baseUrl = getBaseUrl(req);

  // Map chosen digit to internal language code
  let langSelect = "mr"; // Default Marathi
  if (digit === "2") langSelect = "hi";
  if (digit === "3") langSelect = "en";

  console.log(`🌐 Language selected: ${langSelect} (digit: ${digit})`);

  const gather = twiml.gather({
    numDigits: 1,
    action: `${baseUrl}/api/voice/menu?lang=${langSelect}`,
    method: "POST",
    timeout: 8
  });

  // Play main menu perfectly pronounced in the selected language
  if (langSelect === "mr") {
    gather.say({ language: voices["mr"] }, "शेतकरी योजना माहितीसाठी १ दाबा. सरकारी लाभांसाठी २ दाबा. बाजार भावांसाठी ३ दाबा. परत ऐकण्यासाठी ० दाबा.");
  } else if (langSelect === "hi") {
    gather.say({ language: voices["hi"] }, "किसान योजनाओं की जानकारी के लिए १ दबाएं। सरकारी लाभों के लिए २ दबाएं। मंडी भाव के लिए ३ दबाएं। फिर से सुनने के लिए ० दबाएं।");
  } else {
    gather.say({ language: voices["en"] }, "Press 1 for Farmer Schemes. Press 2 for Government Benefits. Press 3 for Mandi Prices. Press 0 to repeat.");
  }

  // Fallback if no digit pressed
  twiml.redirect(`${baseUrl}/api/voice/language`);

  res.type("text/xml");
  res.send(twiml.toString());
});

// 3. MAIN MENU SELECTION - Provide audio answer + follow-up SMS
router.post("/menu", async (req, res) => {
  const digit = req.body.Digits;
  const lang = req.query.lang || "mr";
  
  // Smart detection: If Twilio triggered the call (From = Twilio), then the user is the 'To' number.
  // If the user called Twilio (From = User), then 'From' is correct.
  const myTwilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const callerNumber = (req.body.From === myTwilioNumber) ? req.body.To : req.body.From;
  
  const twiml = new VoiceResponse();
  let smsContent = "";

  try {
    // Hardcoded fallback schemes — works even if DB is empty or offline
    const FALLBACK_SCHEMES = [
      {
        scheme_name: "PM Kisan Samman Nidhi",
        summary: "Direct income support of Rs 6000 per year in 3 installments to farmer families."
      },
      {
        scheme_name: "PM Fasal Bima Yojana",
        summary: "Crop insurance at just 2 percent premium against natural calamities and pests."
      },
      {
        scheme_name: "Kisan Credit Card",
        summary: "Revolving credit up to Rs 3 Lakh at 4 percent interest for agriculture."
      }
    ];

    if (digit === "1") {
      let dbSchemes = [];
      try {
        dbSchemes = await Scheme.find({ category: { $regex: /farmer/i } }).limit(2).maxTimeMS(5000);
        if (dbSchemes.length === 0) dbSchemes = await Scheme.find().limit(2).maxTimeMS(5000);
      } catch (dbErr) {
        console.warn("⚠️ DB query failed, using fallback schemes:", dbErr.message);
      }

      const schemesToRead = dbSchemes.length > 0 ? dbSchemes : FALLBACK_SCHEMES;

      let readoutText = "";
      if (lang === "mr") readoutText = "शेतकऱ्यांसाठी काही महत्त्वाच्या योजना: ";
      else if (lang === "hi") readoutText = "किसानों के लिए कुछ महत्वपूर्ण योजनाएं: ";
      else readoutText = "Some important farmer schemes are: ";

      schemesToRead.forEach((s) => {
        readoutText += (s.scheme_name || s.name) + ". ";
      });

      twiml.say({ language: voices[lang] }, readoutText);

      smsContent = "KRISHISETU: Top Farmer Schemes for you:\n";
      schemesToRead.forEach((s, i) => {
        smsContent += `${i + 1}. ${s.scheme_name || s.name}\n`;
      });
      smsContent += "Full Details: myscheme.gov.in";

    } else if (digit === "2" || digit === "3") {
      const msg = lang === "mr" 
        ? "माहिती गोळा केली जात आहे." 
        : (lang === "hi" ? "जानकारी एकत्र की जा रही है।" : "Currently fetching requested data.");
      twiml.say({ language: voices[lang] }, msg);
      smsContent = "KRISHISETU HELPLINE - More features like Mandi Prices coming soon!\nCall again: 1800-XXX-XXXX";
    } else {
      twiml.redirect(`/api/voice/language?Digits=${lang==="hi"?"2":(lang==="en"?"3":"1")}`);
      return res.type("text/xml").send(twiml.toString());
    }

    // Play confirmation of SMS delivery
    if (lang === "mr") {
      twiml.say({ language: voices["mr"] }, "अधिक माहिती तुमच्या मोबाईलवर एसएमएस द्वारे पाठवली जात आहे. धन्यवाद.");
    } else if (lang === "hi") {
      twiml.say({ language: voices["hi"] }, "अधिक जानकारी आपके मोबाइल पर एस एम एस द्वारा भेजी जा रही है। धन्यवाद।");
    } else {
      twiml.say({ language: voices["en"] }, "Detailed information is being sent via SMS to your mobile phone. Thank you and goodbye.");
    }

    // End Call
    twiml.hangup();

    // TRIGGER THE OUTBOUND SMS TO THE CALLER
    if (smsContent) {
      try {
        // Clean the number: Remove 'whatsapp:' prefix if it exists
        const cleanToNumber = callerNumber.replace("whatsapp:", "");
        
        console.log(`✉️ Sending SMS to clean number: ${cleanToNumber}`);
        
        await client.messages.create({
          body: smsContent,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: cleanToNumber
        });
        console.log("✅ Follow-up SMS Sent successfully!");
      } catch (smsError) {
        console.error("❌ SMS SENDING FAILED:", smsError.message);
        console.error("💡 Hint: In Twilio Trial mode, you can ONLY send SMS to your verified personal number.");
      }
    }

  } catch (err) {
    console.error("🔥 Voice Route Error:", err.message);
    console.error("🔥 Stack:", err.stack);
    twiml.say({ language: voices["en"] }, "An error occurred. Please try again later.");
    twiml.hangup();
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

module.exports = router;
