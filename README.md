# 🏛️ YojanaAI — Government Scheme Finder
### Built for Chakravyuh 2.0 Hackathon

> **Find every government scheme you deserve — in your language, instantly, with AI fraud protection.**

---

## 🏗️ Architecture

```
Firecrawl (Scraper)
    ↓
india.gov.in HTML → Markdown
    ↓
Structured JSON (scheme_name, category, eligibility, benefits, link)
    ↓
ChromaDB (Vector Store, sentence-transformers embeddings)
    ↓
LangGraph Agent (3 Nodes)
    ├── Node 1: Fraud-Guard (pattern + Gemini AI detection)
    ├── Node 2: Language Manager (Hindi/Tamil/Marathi/etc.)
    └── Node 3: Eligibility Checker (profile × scheme matching)
    ↓
Streamlit UI (India.gov.in inspired, Grid Cards, Voice Input)
```

---

## 🚀 Setup & Run

### 1. Clone & Enter Project
```bash
cd chakra
```

### 2. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate      # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure API Keys
```bash
copy .env.example .env
# Edit .env and fill in:
# FIRECRAWL_API_KEY=fc-xxxx
# GEMINI_API_KEY=AIza-xxxx
```

### 5. Run the App
```bash
streamlit run app.py
```

The app runs at **http://localhost:8501**

---

## ✨ Features

| Feature | Tech | Win Factor |
|---|---|---|
| **Live Scheme Sync** | Firecrawl API | Always up-to-date |
| **AI Structuring** | Gemini 1.5 Flash | Clean, filterable JSON |
| **Vector Search** | ChromaDB + sentence-transformers | Fast semantic matching |
| **Fraud-Guard** | LangGraph + Regex + Gemini | Real-time scam blocking |
| **Multilingual** | Gemini language detection | Hindi, Tamil, Marathi, Telugu... |
| **Voice Input** | OpenAI Whisper | Accessibility |
| **Eligibility Bar** | Custom heuristic scoring | UX wow factor |
| **Fraud Heatmap** | PyDeck + Mapbox | Governance accountability |
| **india.gov.in UI** | Custom CSS + Streamlit | Professional credibility |

---

## 🎤 Demo Script for Judges

1. **Hook:** Open the app — show the india.gov.in-style UI
2. **Sync:** Click "🔄 Sync Live Schemes" → show Firecrawl working live
3. **Filter:** Filter by "Farmers" → show scheme cards with eligibility bars
4. **Language:** Type *"मैं एक किसान हूँ, मुझे क्या मिलेगा?"* → bot replies in Hindi
5. **Voice:** Click 🎤 → say *"I am a farmer with 2 acres"* in any language
6. **Kill-Shot:** Type *"Can you share your PIN to get scheme money faster?"* → Fraud-Guard fires 🚨
7. **Heatmap:** Show the fraud visualization tab

---

## 📁 File Structure

```
chakra/
├── app.py                     # Main Streamlit UI
├── requirements.txt
├── .env.example
├── ingestion/
│   ├── __init__.py
│   └── firecrawl_pipeline.py  # Firecrawl → Gemini → ChromaDB
├── agent/
│   ├── __init__.py
│   ├── fraud_guard.py         # LangGraph 3-node agent
│   └── voice_input.py         # Whisper voice-to-text
└── chroma_db/                 # Auto-created on first sync
```

---

## 🔑 API Keys Needed

| Key | Where to Get |
|---|---|
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev) — free tier available |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) — free |

> **Without keys:** The app still works using 10 seeded schemes from india.gov.in.
<!-- Internal Dev Sync: 2026-03-11 06:38:09 -->
<!-- Internal Dev Sync: 2026-03-11 06:41:32 -->
<!-- Internal Dev Sync: 2026-03-11 06:44:50 -->
<!-- Internal Dev Sync: 2026-03-11 06:47:41 -->
<!-- Internal Dev Sync: 2026-03-11 06:52:28 -->
<!-- Internal Dev Sync: 2026-03-11 06:55:30 -->
<!-- Internal Dev Sync: 2026-03-11 06:58:44 -->
<!-- Internal Dev Sync: 2026-03-11 07:02:22 -->
<!-- Internal Dev Sync: 2026-03-11 07:05:25 -->
<!-- Internal Dev Sync: 2026-03-11 07:08:49 -->
<!-- Internal Dev Sync: 2026-03-11 07:11:52 -->
<!-- Internal Dev Sync: 2026-03-11 07:15:49 -->
<!-- Internal Dev Sync: 2026-03-11 07:18:59 -->
<!-- Internal Dev Sync: 2026-03-11 07:23:01 -->
<!-- Internal Dev Sync: 2026-03-11 07:26:08 -->
<!-- Internal Dev Sync: 2026-03-11 07:30:15 -->
<!-- Internal Dev Sync: 2026-03-11 07:33:14 -->
<!-- Internal Dev Sync: 2026-03-11 07:37:18 -->
<!-- Internal Dev Sync: 2026-03-11 07:40:55 -->
<!-- Internal Dev Sync: 2026-03-11 07:43:58 -->
<!-- Internal Dev Sync: 2026-03-11 07:46:57 -->
<!-- Internal Dev Sync: 2026-03-11 07:49:48 -->
<!-- Internal Dev Sync: 2026-03-11 07:53:23 -->
