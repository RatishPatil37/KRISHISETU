const axios = require('axios');
const headers = { 'Authorization': 'Bearer f71004a5-4cfe-49f6-a1e1-de500c7b9f75', 'Content-Type': 'application/json' };
const activeLanguage = 'English';

const body = { 
  assistantId: '332d2014-a377-4efd-9787-3daaca164acf',
  assistantOverrides: {
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "multi",
      endpointing: 500
    },
    voice: {
      provider: "openai",
      voiceId: "nova"
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the LokSeva AI Assistant. You MUST respond in ${activeLanguage}. Speak in clear, detailed paragraphs using the native typography (e.g., Devanagari for Hindi/Marathi). If the user asks a question, give a comprehensive GPT-generated explanation.`
        }
      ]
    },
    silenceTimeoutSeconds: 120 
  }
};

axios.post('https://api.vapi.ai/call/web', body, { headers })
  .then(res => console.log('SUCCESS, no errors!'))
  .catch(err => console.error('FAILED', JSON.stringify(err.response?.data || err.message, null, 2)));
