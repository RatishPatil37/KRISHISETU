require("dotenv").config();

const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);


async function createMessage() {
  const message = await client.messages.create({
    body: "Hello, there!",
    from: "whatsapp:+14155238886",
    to: "whatsapp:+919529707672",
  });

  console.log(message.body);
}

createMessage();