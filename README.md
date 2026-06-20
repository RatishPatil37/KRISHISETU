# 🏛️ LokSevaAI / KrishiSetu — MERN Platform

> **Find every government scheme you deserve — in your language, instantly, with AI document processing and advanced farming diagnostics.**

KrishiSetu (LokSevaAI) is a state-of-the-art, AI-powered agritech and citizen welfare portal designed to empower Indian farmers. It eliminates administrative friction, overcomes language barriers, and provides critical agricultural diagnostics tools directly to the grassroots level.

---

## 🌟 Key Features & Ecosystem Modules
p[;'/ ]
### 1. 🎨 The Landing Page (`LokSevaAI/LandingPage`)
The entrance of the application is a high-end web experience combining a tactile, organic aesthetic with premium modern interactions:
*   **Waving Farmer Preloader:** A custom, warm loading micro-animation of a farmer waving, ensuring a delightful and smooth first impression while assets load.
*   **Hardware-Accelerated Scrolling:** Flawlessly optimized scrolling using GPU rendering (`will-change: transform`) to completely eliminate lag from heavy glassmorphic blurs.
*   **Custom Interactive Cursor:** Responsive, fluid cursor with custom hover states and tracking ripples.
*   **Magnetic Hover Physics:** Interactive buttons that subtly slide toward the user's cursor on hover.
*   **Internal Parallax Masking:** Dynamic depth-illusion effects on cards and images as the page scrolls.
*   **Ambient Bokeh Orbs:** Sleek, atmospheric glowing particles that float in the background, replacing generic emojis for a clean, professional aesthetic.
*   **Multilingual Navigation:** A built-in language toggle in the header supporting English, Hindi, Marathi, and other regional languages.
*   **Direct PM-Kisan Eligibility CTA:** Highly visible, primary action button to immediately check scheme eligibility without digging through menus.
*   **Glassmorphic Footer:** Anchored with standard resources and the humanized brand text: *"Built for Farmers, by the 1% Team"*.

### 2. 🩺 AI Crop Doctor (`CropDoctor`)
A utility designed to identify crop diseases and recommend treatments:
*   **Image Scanning System:** Upload or take real-time photos of infected crop leaves.
*   **Futuristic Diagnostic Mockup:** Displays bounding boxes, glowing scan lines, and confidence level meters.
*   **Gemini AI Diagnostics:** Processes crop imagery to return accurate diagnosis, prevention methods, and recommended organic/chemical remedies.

### 3. 📈 Interactive MSP Tracker (`MSPTracker`)
An interactive dashboard displaying real-time data on the Minimum Support Price (MSP) for vital crops:
*   **Dynamic Sorting & Filtering:** Check prices by crop category, state, or seasonality.
*   **Price Forecasting & Alerts:** Visual indicators of market trends to help farmers decide when to sell.
*   **Fraud Guard Protections:** Safeguards against middlemen by highlighting official government-mandated rates.

### 4. 🗺️ Nearby Offices & Logistics Hub (`LocationMap`)
A high-performance interactive map built for outdoor and high-glare environments:
*   **Satellite Mapping & Watermark-Free View:** A clean interface focused on finding regional logistics hubs, seed distribution points, and government offices.
*   **Logistics Tools:** Dynamic routing options (Drive, Walk, Share directions) with interactive haptic feedback.
*   **Category Grid:** Quickly filter locations for quick navigation.

### 5. 🎤 Vapi Multilingual Voice Assistant (`VapiChatAssistant`)
Voice-based assistant built directly into the dashboard:
*   **Conversational Voice Queries:** Tailored for farmers who prefer voice search in their native tongue over text input.
*   **Intelligent Routing:** Directs users to the correct sections of the app or helps check eligibility verbally.

### 6. 🛒 Peer-to-Peer Marketplace (`Marketplace`)
An open directory matching sellers with direct buyers:
*   **No Intermediaries:** Direct farmer-to-consumer list postings.
*   **Localized Offerings:** Easily filter produce based on proximity.

### 7. 👤 User Profile & Scheme Eligibility Dashboard (`Profile`)
The core personal space where AI-driven analytics help users access benefits:
*   **Eligibility Bar Metrics:** Custom visual meters showing compatibility percentages for active government schemes.
*   **OCR Document Processing:** Upload land documents (e.g., 7/12 records) or ID certificates, which are analyzed automatically via Gemini OCR to fill out and update user profiles.

---

## 🏗️ Technical Architecture

*   **Frontend:** React.js, GSAP (for premium animations), custom CSS variables.
*   **Backend:** Node.js & Express.js.
*   **Database:** MongoDB Atlas.
*   **AI Engine:** Google Gemini 1.5 Flash API (OCR, leaf diagnostics, scheme matching).
*   **Auth & Notifications:** Supabase & Twilio API (SMS Alerts).

---

## 🚀 Setup & Run Instructions

This project requires running both the backend and frontend servers simultaneously.

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   Git

### 2. Clone and Setup
```bash
git clone https://github.com/RatishPatil37/CHK-1772901488112-6254.git
cd CHK-1772901488112-6254
```

### 3. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd LokSevaAI_MERN/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `LokSevaAI_MERN/backend/` and configure:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the backend developer server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. **Open a new terminal window** and navigate to the frontend directory:
   ```bash
   cd LokSevaAI_MERN/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server (runs on `http://localhost:3000`):
   ```bash
   npm start
   ```

### 5. Static Landing Page / Data Collection (Optional)
If you wish to view the static/landing page or the data collection portal separately:
*   **Landing Page:** Open `LokSevaAI/LandingPage/index.html` in any web browser.
*   **Data Collection Module:**
    ```bash
    cd "LokSevaAI/data collection"
    npm install
    npm run dev
    ```

---

## 📁 Project Structure

```
├── LokSevaAI/
│   ├── LandingPage/         # Premium static HTML/CSS/JS Landing Page
│   └── data collection/     # Vite-based data entry and utility dashboard
│
├── LokSevaAI_MERN/
│   ├── backend/
│   │   ├── models/          # User, Scheme database schemas (Mongoose)
│   │   ├── routes/          # Express route controllers (OCR, Auth, Schemes)
│   │   ├── services/        # Third-party integrations (Gemini OCR, Twilio)
│   │   └── server.js        # Backend Entry Point
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/  # CropDoctor, LocationMap, MSPTracker, VapiChat
│       │   ├── Pages/       # Marketplace, Profile Dashboard
│       │   ├── App.js       # Main React Router Routing
│       │   └── index.js     # React Entry
│       └── package.json
```
