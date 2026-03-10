const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the schema for the expected JSON array output
const schemeSchema = {
  type: SchemaType.ARRAY,
  description: "List of government schemes extracted from the provided text",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      scheme_name: {
        type: SchemaType.STRING,
        description: "The official name of the scheme"
      },
      category: {
        type: SchemaType.STRING,
        description: "The general category of the scheme (e.g., Farmers, Women, Business, Education, Health, Senior Citizens, Youth, Housing, General)"
      },
      state: {
        type: SchemaType.STRING,
        description: "The state or 'All India' if it's a central scheme"
      },
      income_level: {
        type: SchemaType.STRING,
        description: "The targeted income level (e.g., All, Below Poverty Line, Low Income, Middle Income)"
      },
      eligibility_criteria: {
        type: SchemaType.STRING,
        description: "A brief summary of who is eligible for the scheme"
      },
      benefits: {
        type: SchemaType.STRING,
        description: "A brief summary of the primary benefits provided"
      },
      application_link: {
        type: SchemaType.STRING,
        description: "A URL or link where the user can apply. Extracted or deduced if possible, otherwise 'N/A' or '#'"
      },
      summary: {
        type: SchemaType.STRING,
        description: "A short 1-2 sentence description of the scheme's purpose"
      },
      eligibility_score: {
        type: SchemaType.NUMBER,
        description: "An arbitrary default eligibility score integer between 50 and 100 for display purposes"
      }
    },
    required: ["scheme_name", "category", "eligibility_criteria", "benefits", "summary", "state", "income_level", "application_link", "eligibility_score"]
  }
};

async function parseSchemesFromMarkdown(markdownText) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    // Use gemini-2.5-flash which is fast and supports JSON schema structure
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schemeSchema,
      }
    });

    const prompt = `
    Analyze the following markdown text scraped from a government schemes portal. 
    Extract a list of distinct government schemes and populate their details accurately into a structured list.
    If the text contains multiple schemes, extract as many distinct schemes as possible.
    If some properties like state, income_level, or application_link are truly unknown, make a reasonable guess based on the context (e.g., 'All India' for central schemes, 'All' for income level, '#' for link).
    Here is the markdown text:

    ---
    ${markdownText}
    ---
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // The response is expected to be a valid JSON array directly due to responseMimeType
    const schemesData = JSON.parse(responseText);
    return schemesData;

  } catch (error) {
    console.error("Error parsing schemes with Gemini:", error);
    throw error;
  }
}

module.exports = { parseSchemesFromMarkdown };
