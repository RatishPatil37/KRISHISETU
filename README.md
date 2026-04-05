# 🏛️ LokSevaAI / KrishiSetu — MERN Platform

> **Find every government scheme you deserve — in your language, instantly, with AI document processing.**

This repository contains the MERN (MongoDB, Express, React, Node.js) stack version of the KrishiSetu platform.

---

## 🏗️ Architecture

-   **Frontend**: React.js
-   **Backend**: Express.js & Node.js
-   **Database**: MongoDB Atlas
-   **AI Integration**: Google Gemini 1.5 Flash (for OCR, analysis, and scheme matching)
-   **Services**: Twilio (Messaging), Supabase (Auth/Mock Auth fallback)

---

## 🚀 Setup & Run Instructions

This project requires simultaneous execution of the Backend API and the Frontend React app. 

### 1. Requirements
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en) (v18 or higher)
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/RatishPatil37/CHK-1772901488112-6254.git
cd CHK-1772901488112-6254
```

### 3. Backend Setup
The backend handles API requests, MongoDB connections, and Gemini AI operations.

```bash
# Navigate to the backend directory
cd LokSevaAI_MERN/backend

# Install dependencies
npm install

# Setup Environment Variables
# Create a .env file and add the required parameters:
# PORT=5000
# MONGO_URI=your_mongodb_atlas_connection_string
# GEMINI_API_KEY=your_gemini_api_key

# Start the server (runs on port 5000)
npm run dev
```

### 4. Frontend Setup
The frontend is the React user interface. **Open a new terminal window** for this step.

```bash
# Navigate to the frontend directory from the project root
cd LokSevaAI_MERN/frontend

# Install dependencies
npm install

# Start the React app (runs on port 3000)
npm start
```

### 5. Data Collection App Setup (Optional)
If you also need to run the separate Data Collection module (built with Vite), **open a new terminal window**:

```bash
# Navigate to the data collection directory
cd "LokSevaAI/data collection"

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will automatically open in your browser or be available at `http://localhost:5173`.

---

## ✨ Key Features

| Feature | Tech | Benefit |
|---|---|---|
| **AI Document Processing** | Google Gemini | Extracts eligibility data from uploaded schemes & user documents (e.g., 7/12 land records). |
| **Real-time Synchronization** | Express + MongoDB | Instantly syncs user profiles to an accessible database. |
| **Multilingual Voice Input** | Custom integration | Users can search via voice for accessibility. |
| **Eligibility Bar** | Custom Scoring System | Visually indicates how eligible a user is for a specific scheme based on their profile. |

---

## 📁 Project Structure

```
├── LokSevaAI_MERN/
│   ├── backend/
│   │   ├── models/        # Mongoose database schemas (Users, Schemes)
│   │   ├── routes/        # Express endpoints (ocr, users, schemes)
│   │   ├── services/      # Business logic (Gemini OCR, data fetch)
│   │   └── server.js      # Main Express App Entry Point
│   │
│   └── frontend/
│       ├── public/
│       ├── src/
│       │   ├── components/  # Reusable UI Parts
│       │   ├── Pages/       # Screens (Profile, Dashboard)
│       │   └── App.js       # Main React Component
│       └── package.json
```
