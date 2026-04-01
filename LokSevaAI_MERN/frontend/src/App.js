import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import Profile from "./Pages/Profile";
import VapiChatAssistant from './components/VapiChatAssistant';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, ShieldX, Activity, Settings, Type, CheckCircle, UploadCloud, FileText, Sun, Moon, MessageCircle, Smartphone, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

// Language Dictionary for Dynamic Translation
const DICTIONARY = {
  'English': {
    title: "Find Your Government Benefit",
    subtitle: "Discover schemes you're entitled to — in your language, instantly.",
    tab_browse: "Browse Schemes",
    tab_ai: "AI Assistant + Voice",
    tab_fraud: "Fraud Heatmap",
    tab_pdf: "PDF Wizard",
    tab_location: "Nearby Offices",
    active_schemes: "Active Schemes",
    categories: "Categories",
    languages: "Languages",
    fraud_protection: "Fraud Protection",
    apply_now: "Apply Now",
    eligibility_score: "Your Eligibility Score",
    sync_live: "Sync Live Schemes",
    my_profile: "MY PROFILE",
    view_profile: "View Profile",
    logout: "Logout",
    login: "Login with Google",
    language_header: "LANGUAGE",
    filters_header: "SCHEME FILTERS",
    tab_taaza: "Taaza Khabar",
    taaza_desc: "Latest notifications and news regarding government schemes in India."
  },
  'हिंदी': {
    title: "अपना सरकारी लाभ खोजें",
    subtitle: "अपनी भाषा में तुरंत उन योजनाओं की खोज करें जिनके आप हकदार हैं।",
    tab_browse: "योजनाएं खोजें",
    tab_ai: "एआई सहायक + वॉयस",
    tab_fraud: "धोखाधड़ी हीटमैप",
    tab_pdf: "पीडीएफ विश्लेषक",
    tab_location: "निकटतम कार्यालय",
    active_schemes: "सक्रिय योजनाएं",
    categories: "श्रेणियाँ",
    languages: "भाषाएं",
    fraud_protection: "धोखाधड़ी सुरक्षा",
    apply_now: "अभी आवेदन करें",
    eligibility_score: "आपकी पात्रता स्कोर",
    sync_live: "लाइव सिंक",
    my_profile: "मेरी प्रोफ़ाइल",
    view_profile: "प्रोफ़ाइल देखें",
    logout: "लॉग आउट",
    login: "Google से लॉगिन करें",
    language_header: "भाषा",
    filters_header: "फिल्टर्स",
    tab_taaza: "ताज़ा ख़बर",
    taaza_desc: "भारत में सरकारी योजनाओं के बारे में नवीनतम सूचनाएं और समाचार।"
  },
  'मराठी': {
    title: "तुमचा सरकारी लाभ शोधा",
    subtitle: "तुमच्या भाषेत लगेचच तुम्ही पात्र असलेल्या योजना शोधा.",
    tab_browse: "योजना शोधा",
    tab_ai: "AI सहाय्यक + व्हॉइस",
    tab_fraud: "फसवणूक हीटमॅप",
    tab_pdf: "PDF विश्लेषक",
    tab_location: "जवळची कार्यालये",
    active_schemes: "सक्रिय योजना",
    categories: "श्रेण्या",
    languages: "भाषा",
    fraud_protection: "फसवणूक संरक्षण",
    apply_now: "आता अर्ज करा",
    eligibility_score: "तुमचा पात्रता स्कोअर",
    sync_live: "लाइव्ह सिंक",
    my_profile: "माझी प्रोफाईल",
    view_profile: "प्रोफाईल पहा",
    logout: "लॉगआउट",
    login: "Google सह लॉग इन करा",
    language_header: "भाषा",
    filters_header: "फिल्टर्स",
    tab_taaza: "ताजी बातमी",
    taaza_desc: "भारतातील सरकारी योजनांबद्दलच्या नवीनतम सूचना आणि बातम्या."
  },
  'தமிழ்': {
    title: "உங்கள் அரசு நன்மையை கண்டறியவும்",
    subtitle: "உங்களுக்கு உரிமையான திட்டங்களை — உங்கள் மொழியில், உடனடியாக கண்டறியவும்.",
    tab_browse: "திட்டங்களை உலாவு",
    tab_ai: "AI உதவியாளர் + குரல்",
    tab_fraud: "மோசடி வெப்ப வரைபடம்",
    tab_pdf: "PDF வழிகாட்டி",
    tab_location: "அருகிலுள்ள அலுவலகங்கள்",
    active_schemes: "செயலில் உள்ள திட்டங்கள்",
    categories: "வகைகள்",
    languages: "மொழிகள்",
    fraud_protection: "மோசடி பாதுகாப்பு",
    apply_now: "இப்போது விண்ணப்பிக்கவும்",
    eligibility_score: "உங்கள் தகுதி மதிப்பெண்",
    sync_live: "நேரடி சுருக்கம்",
    my_profile: "என் சுயவிவரம்",
    view_profile: "சுயவிவரத்தைக் காண்க",
    logout: "வெளியேறு",
    login: "Google உடன் உள்நுழைக",
    language_header: "மொழி",
    filters_header: "திட்ட வடிப்பான்கள்",
    tab_taaza: "சமீபத்திய செய்திகள்",
    taaza_desc: "இந்தியாவில் உள்ள அரசு திட்டங்கள் குறித்த சமீபத்திய அறிவிப்புகள் மற்றும் செய்திகள்."
  },
  'తెలుగు': {
    title: "మీ ప్రభుత్వ ప్రయోజనాన్ని కనుగొనండి",
    subtitle: "మీకు అర్హత ఉన్న పథకాలను — మీ భాషలో, తక్షణమే కనుగొనండి.",
    tab_browse: "పథకాలను బ్రౌజ్ చేయండి",
    tab_ai: "AI అసిస్టెంట్ + వాయిస్",
    tab_fraud: "మోసాల హీట్‌మ్యాప్",
    tab_pdf: "PDF విశ్లేషకుడు",
    tab_location: "సమీప కార్యాలయాలు",
    active_schemes: "క్రియాశీల పథకాలు",
    categories: "కేటగిరీలు",
    languages: "భాషలు",
    fraud_protection: "మోసం రక్షణ",
    apply_now: "ఇప్పుడే దరఖాస్తు చేసుకోండి",
    eligibility_score: "మీ అర్హత స్కోరు",
    sync_live: "లైవ్ సింక్",
    my_profile: "నా ప్రొఫైల్",
    view_profile: "ప్రొఫైల్ చూడండి",
    logout: "లాగ్అవుట్",
    login: "Google తో లాగిన్ చేయండి",
    language_header: "భాష",
    filters_header: "ఫిల్టర్లు",
    tab_taaza: "తాజా వార్తలు",
    taaza_desc: "భారతదేశంలో ప్రభుత్వ పథకాలకు సంబంధించిన తాజా నోటిఫికేషన్‌లు మరియు వార్తలు."
  }
};

// Auth Callback Component
function AuthCallback() {
  const { checkOnboardedStatus } = useAuth();
  const [status, setStatus] = useState("Completing authentication...");
  const hasRun = React.useRef(false);  // ← prevent re-runs when AuthContext re-renders

  const APP_URL = 'http://localhost:5000/app';

  useEffect(() => {
    // Guard: only run once even if deps change due to context re-renders
    if (hasRun.current) return;
    hasRun.current = true;

    let cancelled = false;

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isMockBypass = urlParams.get('mock_bypass') === 'true';
        const fromDataCollection = urlParams.get('from') === 'datacollection';

        // --- DEVELOPMENT MOCK BYPASS ---
        if (isMockBypass) {
          setStatus("Mock Bypass: Setting up your session...");
          // We set a flag in localStorage that AuthContext will pick up
          localStorage.setItem('krishisetu_mock_logged_in', 'true');

          if (fromDataCollection) {
            window.location.href = APP_URL;
            return;
          }
          window.location.href = APP_URL;
          return;
        }

        /* --- PRODUCTION SUPABASE AUTH ---
        // Step 1: Extract tokens from URL hash
        const rawHash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        let resolvedUser = null;

        if (access_token && refresh_token) {
          // Step 2: Explicitly set session at this origin (5000)
          setStatus("Setting up your session...");
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          resolvedUser = data?.user ?? null;
          // Clean hash from URL without a reload
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          // Fallback: session might already exist
          const { data } = await supabase.auth.getSession();
          resolvedUser = data?.session?.user ?? null;
        }

        if (cancelled) return;

        if (!resolvedUser) {
          window.location.href = 'http://localhost:5000';
          return;
        }

        // Step 3: Route based on onboarding state
        if (fromDataCollection) {
          window.location.href = APP_URL;
          return;
        }

        setStatus("Checking your profile...");
        const isOnboarded = await checkOnboardedStatus(resolvedUser.email);
        if (cancelled) return;

        if (!isOnboarded) {
          window.location.href = 'http://localhost:5173';
          return;
        }

        window.location.href = APP_URL;
        */

      } catch (err) {
        console.error('AuthCallback error:', err);
        if (!cancelled) {
          setStatus('Error: ' + err.message + '. Redirecting...');
          setTimeout(() => { window.location.href = APP_URL; }, 2000);
        }
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, []); // empty deps — run once on mount only

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '18px'
    }}>
      <div style={{ marginBottom: '16px' }}>⏳</div>
      {status}
    </div>
  );
}


function App() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [schemes, setSchemes] = useState([
    {
      _id: 1,
      scheme_name: 'PM Fasal Bima Yojana',
      category: 'Farmers',
      state: 'All India',
      income_level: 'All',
      summary: 'Low-premium crop insurance against natural disasters and weather events.',
      eligibility_criteria: 'Farmers across India',
      benefits: 'Insurance coverage',
      application_link: '#',
      eligibility_score: 65
    },
    {
      _id: 2,
      scheme_name: 'Beti Bachao Beti Padhao',
      category: 'Women',
      state: 'All India',
      income_level: 'All',
      summary: 'Empowering girl child through education and financial security schemes.',
      eligibility_criteria: 'Girl children',
      benefits: 'Educational and financial support',
      application_link: '#',
      eligibility_score: 55
    },
    {
      _id: 3,
      scheme_name: 'Pradhan Mantri Mudra Yojana',
      category: 'Business',
      state: 'All India',
      income_level: 'All',
      summary: 'Collateral-free business loans up to ₹10 lakh for micro entrepreneurs.',
      eligibility_criteria: 'Entrepreneurs without collateral',
      benefits: 'Business loans',
      application_link: '#',
      eligibility_score: 65
    }
  ]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedIncome, setSelectedIncome] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  // New Feature States
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Translation Helper
  const t = (key) => DICTIONARY[selectedLanguage]?.[key] || DICTIONARY['English'][key] || key;

  // Taaza Khabar Dummy Data
  const taazaKhabarNews = [
    { id: 1, title: 'PM Kisan Samman Nidhi 16th Installment Released', date: '2026-03-10', time: '14:30', description: 'The government has released the 16th installment of PM Kisan Samman Nidhi. Eligible farmers will directly receive Rs 2000 in their bank accounts.' },
    { id: 2, title: 'New Subsidies for Rooftop Solar Panels', date: '2026-03-09', time: '10:15', description: 'Under the PM Surya Ghar scheme, subsidies up to 60% for 2kW systems are now open for applications through the national portal.' },
    { id: 3, title: 'Ayushman Bharat Expansion to Senior Citizens', date: '2026-03-08', time: '09:00', description: 'Citizens over 70 years are now automatically eligible for Rs 5 Lakh health coverage under Ayushman Bharat regardless of income.' },
    { id: 4, title: 'Mudra Loan Limits Enhanced', date: '2026-03-07', time: '16:45', description: 'The upper limit for Tarun category of Mudra loans has been enhanced to Rs 20 Lakhs from the existing Rs 10 Lakhs to support growing businesses.' },
  ];

  // OCR Document Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // '' | 'uploading' | 'success' | 'error'
  const [pdfInsights, setPdfInsights] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0=idle,1=uploading,2=ocr,3=gemini,4=done

  const runOcr = async (file) => {
    setSelectedFile(file);
    setUploadStatus('uploading');
    setPdfInsights('');
    setScanStep(1);

    const formData = new FormData();
    formData.append('document', file);

    // Simulate step progression for UX
    const stepTimer1 = setTimeout(() => setScanStep(2), 800);  // OCR
    const stepTimer2 = setTimeout(() => setScanStep(3), 2000); // Gemini

    try {
      const res = await fetch('http://localhost:5000/api/ocr/analyze-image', {
        method: 'POST',
        body: formData,
      });
      clearTimeout(stepTimer1); clearTimeout(stepTimer2);
      const data = await res.json();
      if (data.success) {
        setPdfInsights(data.insights);
        setScanStep(4);
        setUploadStatus('success');
      } else {
        setScanStep(0);
        setUploadStatus('error');
      }
    } catch (err) {
      clearTimeout(stepTimer1); clearTimeout(stepTimer2);
      setScanStep(0);
      setUploadStatus('error');
      console.error(err);
    }
  };

  const handleFileUpload = (e) => { const file = e.target.files[0]; if (file) runOcr(file); };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) runOcr(file);
  };

  // Location params state for location tracer
  const [locationParams, setLocationParams] = useState(null);
  const [showMapPins, setShowMapPins] = useState(false);

  useEffect(() => {
    if (activeTab === 'location' && !locationParams) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationParams({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          (error) => {
            console.error("Error getting location", error);
            // Default location: New Delhi
            setLocationParams({ lat: 28.6139, lng: 77.2090 });
          }
        );
      }
    }
  }, [activeTab]);

  // ── Sync schemes + trigger WhatsApp notification ──
  const syncSchemes = async () => {
    console.log("SYNC CLICKED");
    console.log("user object:", user);
    console.log("uid being sent:", user?.id);
    try {
      setIsLoading(true);
      const uid = user?.id ?? "";
      const res = await fetch(`http://localhost:5000/api/firecrawl/sync?uid=${uid}`);
      const data = await res.json();
      console.log("Fetched schemes:", data);
      if (data.success && data.schemes) {
        setSchemes(data.schemes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the root font-size for full page accessibility scaling
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontSizeMultiplier}px`;
  }, [fontSizeMultiplier]);

  useEffect(() => {
    filterSchemes();
  }, [schemes, selectedCategory, selectedState, selectedIncome]);

  const filterSchemes = () => {
    let filtered = schemes;

    if (selectedCategory) {
      filtered = filtered.filter(scheme => scheme.category === selectedCategory);
    }

    if (selectedState) {
      filtered = filtered.filter(scheme => scheme.state === selectedState);
    }

    if (selectedIncome) {
      filtered = filtered.filter(scheme => scheme.income_level === selectedIncome);
    }

    setFilteredSchemes(filtered);
  };

  const categories = ['Farmers', 'Women', 'Business', 'Education', 'Health', 'Senior Citizens', 'Youth', 'Housing', 'General'];
  const states = ['All India', 'Punjab', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'Karnataka', 'Rajasthan', 'Delhi'];
  const incomes = ['All', 'Below Poverty Line', 'Low Income', 'Middle Income'];
  const languages = ['English', 'हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు'];

  const getCategoryColor = (category) => {
    if (!category) return '#103567';
    const colors = {
      'Farmers': '#2d5a3d',
      'Women': '#8e44ad',
      'Business': '#e67300',
      'Education': '#2980b9',
      'Health': '#c0392b',
      'Senior Citizens': '#7f8c8d',
      'Youth': '#16a085',
      'Housing': '#d35400',
      'General': '#103567'
    };
    return colors[category] || '#103567';
  };


  const handleApply = (e, scheme) => {
    e.preventDefault();
    if (scheme.application_link && scheme.application_link !== '#') {
      window.open(scheme.application_link, '_blank');
    } else {
      // Fallback if no valid link exists
      alert("Application link is currently unavailable for this scheme.");
    }
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className={`app ${isHighContrast ? 'high-contrast' : ''}`} style={{ fontSize: `${16 * fontSizeMultiplier}px` }}>
          {/* Top Banner */}
          <div className="top-banner">
            <div className="top-banner-inner">
              <span>Government of India | भारत सरकार</span>
              <span>Powered by KRISHISETU Platform</span>
            </div>
          </div>

          <div className="app-container">
            {/* Left Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <h1>KRISHISETU</h1>
                <p>Smart Scheme Finder</p>
              </div>

              {/* Language Section */}
              <div className="sidebar-section">
                <h3>{t('language_header')}</h3>
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="language-select">
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Filters Section */}
              <div className="sidebar-section">
                <h3>{t('filters_header')}</h3>

                <div className="filter-group">
                  <label>Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
                    <option value="">All categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>State / UT</label>
                  <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="filter-select">
                    <option value="">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Income Level</label>
                  <div className="income-tags">
                    {selectedIncome && (
                      <span className="income-tag">
                        {selectedIncome}
                        <button onClick={() => setSelectedIncome('')}>✕</button>
                      </span>
                    )}
                    {!selectedIncome && (
                      <select value={selectedIncome} onChange={(e) => setSelectedIncome(e.target.value)} className="filter-select">
                        <option value="">All</option>
                        {incomes.map(inc => (
                          <option key={inc} value={inc}>{inc}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="sidebar-section">
                <h3>{t('my_profile')}</h3>
                {user ? (
                  <>
                    <p className="user-email">{user.email}</p>
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                      {t('view_profile')}
                    </button>
                    <button className="logout-btn" onClick={signOut}>
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                    Please sign in from the landing page.
                  </p>
                )}
              </div>

              {/* Data Sync */}
              <div className="sidebar-section">
                <h3>DATA SYNC</h3>
                <button
                  type="button"
                  className="sync-btn"
                  disabled={isLoading}
                  onClick={syncSchemes}
                >
                  {isLoading ? "Syncing..." : t('sync_live')}
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
              {/* Header with Stats */}
              <div className="main-header">
                <div className="header-left">
                  <h1>KRISHISETU</h1>
                  <p>सरकारी योजना खोजें | Government Scheme Finder</p>
                </div>
              </div>

              {/* Hero Section */}
              <section className="hero-section">
                <h2>{t('title')}</h2>
                <p>{t('subtitle')}</p>
                <div className="hero-stats">
                  <div className="stat-pill">
                    <span>10+</span> {t('active_schemes')}
                  </div>
                  <div className="stat-pill">
                    <span>9</span> {t('categories')}
                  </div>
                  <div className="stat-pill">
                    <span>8</span> {t('languages')}
                  </div>
                  <div className="stat-pill">
                    <span>AI</span> {t('fraud_protection')}
                  </div>
                </div>
              </section>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  {t('tab_browse')}
                </button>
                <button
                  className={`tab ${activeTab === 'assistant' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assistant')}
                >
                  {t('tab_ai')}
                </button>
                <button
                  className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pdf')}
                >
                  {t('tab_pdf')}
                </button>
                <button
                  className={`tab ${activeTab === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveTab('location')}
                >
                  {t('tab_location')}
                </button>
                <button
                  className={`tab ${activeTab === 'fraud' ? 'active' : ''}`}
                  onClick={() => setActiveTab('fraud')}
                >
                  {t('tab_taaza')}
                </button>
              </div>

              {/* Available Schemes */}
              {activeTab === 'browse' && (
                <div className="schemes-container">
                  <h3>📋 Available Schemes</h3>
                  {isLoading ? (
                    <div className="loading">Loading schemes...</div>
                  ) : filteredSchemes.length > 0 ? (
                    <div className="schemes-grid">
                      {filteredSchemes.map((scheme) => (
                        <div key={scheme._id} className="scheme-card">
                          <div className="card-header" style={{ background: getCategoryColor(scheme.category), borderTop: 'none', padding: '24px 24px 20px' }}>
                            <div className="card-category" style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>✦</span> {scheme.category?.toUpperCase() || 'GENERAL'}
                            </div>
                            <h3 className="card-title" style={{ color: '#ffffff' }}>{scheme.scheme_name}</h3>
                          </div>
                          <div className="card-body">
                            <p className="card-summary">{scheme.summary}</p>
                            <div className="card-meta">
                              <span className="meta-tag">State: {scheme.state}</span>
                              <span className="meta-tag">Income: {scheme.income_level}</span>
                            </div>
                            <div className="eligibility-score">
                              <div className="score-label">{t('eligibility_score')}: <strong>{scheme.eligibility_score}%</strong></div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${scheme.eligibility_score}%` }}></div>
                              </div>
                            </div>
                            <button onClick={(e) => handleApply(e, scheme)} className="btn-apply" disabled={whatsappStatus !== null}>
                              {whatsappStatus === 'processing' ? 'Processing...' : t('apply_now')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-schemes">No schemes found matching your filters.</div>
                  )}
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="tab-content">
                  <h3>{t('tab_ai')}</h3>
                  <p>Chat with our AI assistant or use voice search to find schemes.</p>
                </div>
              )}

              {/* PDF Parsing Wizard Tab */}
              {activeTab === 'pdf' && (
                <div className="tab-content pdf-wizard">
                  {/* Header */}
                  <div className="fraud-header">
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={26} color="#003366" /> AI Policy PDF &amp; Image Analyzer
                      </h3>
                      <p style={{ marginTop: 4, color: '#555', fontSize: '0.95rem' }}>
                        Upload any government policy document or image — our AI will OCR-scan it and generate a plain-language summary.
                      </p>
                    </div>
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      position: 'relative',
                      marginTop: '20px',
                      padding: '48px 32px',
                      background: isDragOver ? '#eef4ff' : '#f8faff',
                      border: `2px dashed ${isDragOver ? '#4a6cf7' : '#103567'}`,
                      borderRadius: '12px',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      id="ocr-file-input"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploadStatus === 'uploading'}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 10 }}
                    />
                    <UploadCloud size={56} color={isDragOver ? '#4a6cf7' : '#103567'} style={{ margin: '0 auto 14px', display: 'block', transition: 'color 0.2s' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#103567', fontSize: '1.15rem', fontWeight: 700 }}>
                      {isDragOver ? '📂 Release to Scan' : 'Drag & Drop a PDF or Image'}
                    </h4>
                    <p style={{ color: '#777', fontSize: '0.88rem', margin: '0 0 16px' }}>Supports PDF, PNG, JPG, JPEG &bull; Max 10 MB</p>
                    <button
                      style={{
                        pointerEvents: 'none',
                        background: '#103567', color: '#fff',
                        border: 'none', borderRadius: '6px',
                        padding: '10px 28px', fontWeight: 600, fontSize: '0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      {uploadStatus === 'uploading' ? '⏳ Scanning...' : 'Browse Files'}
                    </button>
                  </div>

                  {/* File preview chip */}
                  {selectedFile && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#e8f0fd', border: '1px solid #b3cdf5',
                        borderRadius: '20px', padding: '4px 12px',
                        fontSize: '0.82rem', color: '#103567', fontWeight: 600,
                      }}>
                        📄 {selectedFile.name}
                        <span style={{ color: '#888', fontWeight: 400 }}>({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      </span>
                      {(uploadStatus === 'success' || uploadStatus === 'error') && (
                        <button
                          onClick={() => { setSelectedFile(null); setUploadStatus(''); setPdfInsights(''); setScanStep(0); }}
                          style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
                        >Clear</button>
                      )}
                    </div>
                  )}

                  {/* Scan Step Tracker */}
                  {uploadStatus === 'uploading' && (
                    <div style={{ marginTop: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px' }}>
                      <p style={{ fontWeight: 700, color: '#103567', marginBottom: '16px', fontSize: '0.95rem' }}>🔍 Scanning Document...</p>
                      {[
                        { step: 1, label: 'Uploading document to server', icon: '⬆️' },
                        { step: 2, label: scanStep >= 2 && selectedFile?.name?.toLowerCase().endsWith('.pdf') ? 'Extracting text from PDF' : 'Running Tesseract.js OCR on image', icon: '📖' },
                        { step: 3, label: 'Sending to Gemini AI for analysis', icon: '🤖' },
                      ].map(({ step, label, icon }) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', opacity: scanStep >= step ? 1 : 0.35, transition: 'opacity 0.4s' }}>
                          <span style={{ fontSize: '1.2rem' }}>{scanStep > step ? '✅' : scanStep === step ? '⏳' : icon}</span>
                          <span style={{ fontSize: '0.9rem', color: scanStep >= step ? '#103567' : '#999', fontWeight: scanStep === step ? 700 : 400 }}>{label}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '12px', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(scanStep / 3) * 100}%`, background: 'linear-gradient(90deg, #103567, #4a6cf7)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {uploadStatus === 'error' && (
                    <div style={{ marginTop: '20px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                      <div>
                        <p style={{ color: '#c53030', fontWeight: 700, margin: 0 }}>Document Analysis Failed</p>
                        <p style={{ color: '#742a2a', fontSize: '0.87rem', marginTop: '4px' }}>Make sure the backend is running on port 5000 and the Gemini API key is set. Try a clearer image or a text-based PDF.</p>
                      </div>
                    </div>
                  )}

                  {/* Success — Summary Box */}
                  {uploadStatus === 'success' && pdfInsights && (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <CheckCircle size={20} color="#276749" />
                        <h4 style={{ margin: 0, color: '#276749', fontSize: '1rem', fontWeight: 700 }}>AI Document Summary</h4>
                        <span style={{ marginLeft: 'auto', background: '#c6f6d5', color: '#276749', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Powered by Gemini + Tesseract</span>
                      </div>
                      <div
                        id="pdf-export-content"
                        style={{
                          background: '#f0fff4',
                          border: '1px solid #9ae6b4',
                          borderRadius: '10px',
                          padding: '20px 22px',
                          maxHeight: '420px',
                          overflowY: 'auto',
                        }}>
                        {/* Header for PDF export (hidden in UI, shown in PDF) */}
                        <div className="pdf-only-header" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #103567', paddingBottom: '10px' }}>
                          <h2 style={{ color: '#103567', margin: '0 0 5px' }}>KRISHISETU</h2>
                          <p style={{ margin: 0, color: '#555' }}>AI Policy Analyzer Report — {selectedFile?.name}</p>
                        </div>
                        {pdfInsights.split('\n').map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={i} style={{ height: '8px' }} />;
                          // Bold headings like "## Section" or lines ending with :
                          if (trimmed.startsWith('##') || trimmed.startsWith('**')) {
                            return <p key={i} style={{ fontWeight: 700, color: '#103567', margin: '10px 0 4px', fontSize: '0.97rem' }}>{trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</p>;
                          }
                          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            return <p key={i} style={{ margin: '3px 0 3px 14px', color: '#2d3748', fontSize: '0.9rem' }}>• {trimmed.slice(2)}</p>;
                          }
                          return <p key={i} style={{ margin: '4px 0', color: '#2d3748', fontSize: '0.9rem', lineHeight: 1.65 }}>{trimmed}</p>;
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <button
                          onClick={() => navigator.clipboard?.writeText(pdfInsights)}
                          style={{ background: 'none', border: '1px solid #103567', borderRadius: '6px', padding: '8px 16px', color: '#103567', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >📋 Copy Text</button>

                        <button
                          onClick={() => {
                            const element = document.getElementById('pdf-export-content');
                            // Temporarily show the pure PDF header
                            const header = element.querySelector('.pdf-only-header');
                            if (header) header.style.display = 'block';

                            const opt = {
                              margin: 10,
                              filename: `KrishiSetu_Report_${selectedFile?.name.replace(/\.[^/.]+$/, "") || 'Doc'}.pdf`,
                              image: { type: 'jpeg', quality: 0.98 },
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                            };

                            html2pdf().set(opt).from(element).save().then(() => {
                              // Hide header again
                              if (header) header.style.display = 'none';
                            });
                          }}
                          style={{ background: '#103567', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        ><Download size={16} /> Download PDF Report</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'location' && (
                <div className="tab-content taaza-dashboard">
                  <div className="location-tracer-container">
                    <div className="tracer-header">
                      <h3>Nearby Government Offices</h3>
                      <p>Locate government offices within a radius based on your current location.</p>
                    </div>
                    {locationParams ? (
                      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                        <iframe
                          title="Government Offices Locator"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: '1px solid #dee2e6', borderRadius: '4px' }}
                          referrerPolicy="no-referrer-when-downgrade"
                          src={showMapPins
                            ? `https://www.google.com/maps/embed/v1/search?key=AIzaSyBo76tcZqaSv8KSTeoAUhEdtnTLW28HTtg&q=government+offices&center=${locationParams.lat},${locationParams.lng}&zoom=14`
                            : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBo76tcZqaSv8KSTeoAUhEdtnTLW28HTtg&q=${locationParams.lat},${locationParams.lng}&zoom=14`}
                          allowFullScreen>
                        </iframe>
                        <button
                          className="btn-apply"
                          onClick={() => setShowMapPins(!showMapPins)}
                          style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '12px 24px',
                            fontSize: '1rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 10,
                            margin: 0,
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>{showMapPins ? '👤' : '🏛️'}</span>
                          {showMapPins ? 'Show My Location' : 'Find Nearby Govt Offices'}
                        </button>
                      </div>
                    ) : (
                      <div className="location-loading-state">
                        Waiting for location access to show nearby government offices...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'fraud' && (
                <div className="tab-content taaza-dashboard">
                  <div className="fraud-header">
                    <div>
                      <h3>{t('tab_taaza')}</h3>
                      <p>{t('taaza_desc')}</p>
                    </div>
                  </div>

                  <div className="taaza-khabar-container">
                    <div className="marquee-wrapper">
                      <div className="marquee-content">
                        {taazaKhabarNews.map((news, index) => (
                          <div
                            key={news.id}
                            className="news-item curved-square"
                          >
                            <div className="news-header">
                              <span className="news-title">{news.title}</span>
                              <span className="news-meta">{news.date} | {news.time} IST</span>
                            </div>
                            <div className="news-desc">
                              {news.description}
                            </div>
                          </div>
                        ))}
                        {/* Duplicate for infinite scrolling effect */}
                        {taazaKhabarNews.map((news, index) => (
                          <div
                            key={`dup-${news.id}`}
                            className="news-item curved-square"
                          >
                            <div className="news-header">
                              <span className="news-title">{news.title}</span>
                              <span className="news-meta">{news.date} | {news.time} IST</span>
                            </div>
                            <div className="news-desc">
                              {news.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* WhatsApp Success Modal Overlay */}
          {whatsappStatus && (
            <div className="whatsapp-overlay">
              <div className="whatsapp-modal">
                {whatsappStatus === 'processing' ? (
                  <>
                    <div className="spinner"></div>
                    <h4>Processing Application...</h4>
                    <p>Connecting securely to government portals.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle size={56} color="#25D366" />
                    <h4 style={{ marginTop: '16px' }}>Application Successful!</h4>
                    <p>Future eligibility alerts and confirmation receipt have been linked to your registered mobile via <strong>WhatsApp (+91 8080484908)</strong>.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Floating Accessibility Widget */}
          <div className="accessibility-widget">
            <button className="accessibility-btn" onClick={() => setAccessibilityOpen(!accessibilityOpen)}>
              <Settings size={24} />
            </button>
            {accessibilityOpen && (
              <div className="accessibility-panel">
                <h4>Accessibility Tools</h4>

                <div className="acc-section">
                  <label>Contrast Adjustment</label>
                  <div className="acc-grid">
                    <div className={`acc-option ${!isHighContrast ? 'active' : ''}`} onClick={() => setIsHighContrast(false)}>
                      <Sun size={20} />
                      <span>Normal</span>
                    </div>
                    <div className={`acc-option ${isHighContrast ? 'active' : ''}`} onClick={() => setIsHighContrast(true)}>
                      <Moon size={20} />
                      <span>High Contrast</span>
                    </div>
                  </div>
                </div>

                <div className="acc-section" style={{ marginTop: '16px' }}>
                  <label>Text Size</label>
                  <div className="acc-grid">
                    <div className="acc-option" onClick={() => setFontSizeMultiplier(prev => Math.min(prev + 0.1, 1.3))}>
                      <Type size={20} />
                      <span>Increase Text</span>
                    </div>
                    <div className="acc-option" onClick={() => setFontSizeMultiplier(prev => Math.max(prev - 0.1, 0.8))}>
                      <Type size={16} />
                      <span>Decrease Text</span>
                    </div>
                    <div className="acc-option" style={{ gridColumn: 'span 2' }} onClick={() => setFontSizeMultiplier(1)}>
                      <Settings size={20} />
                      <span>Reset Text</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inject VAPI Assistant Widget */}
          <VapiChatAssistant />
        </div>
      } />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;