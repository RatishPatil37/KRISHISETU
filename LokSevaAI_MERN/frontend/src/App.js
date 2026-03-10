import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from './AuthContext';
import Profile from "./Pages/Profile";
import VapiChatAssistant from './components/VapiChatAssistant';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, ShieldX, Activity, Settings, Type, CheckCircle, UploadCloud, FileText, Sun, Moon, MessageCircle, Smartphone } from 'lucide-react';

// Language Dictionary for Dynamic Translation
const DICTIONARY = {
  'English': {
    title: "Find Your Government Benefit",
    subtitle: "Discover schemes you're entitled to — in your language, instantly.",
    tab_browse: "📋 Browse Schemes",
    tab_ai: "🤖 AI Assistant + Voice",
    tab_fraud: "🗺️ Fraud Heatmap",
    tab_pdf: "📄 PDF Wizard",
    active_schemes: "Active Schemes",
    categories: "Categories",
    languages: "Languages",
    fraud_protection: "Fraud Protection",
    apply_now: "Apply Now →",
    eligibility_score: "Your Eligibility Score",
    sync_live: "📊 Sync Live Schemes",
    my_profile: "👤 MY PROFILE",
    view_profile: "View Profile",
    logout: "Logout",
    login: "Login with Google",
    language_header: "🌐 LANGUAGE",
    filters_header: "🔍 SCHEME FILTERS"
  },
  'हिंदी': {
    title: "अपना सरकारी लाभ खोजें",
    subtitle: "अपनी भाषा में तुरंत उन योजनाओं की खोज करें जिनके आप हकदार हैं।",
    tab_browse: "📋 योजनाएं खोजें",
    tab_ai: "🤖 एआई सहायक + वॉयस",
    tab_fraud: "🗺️ धोखाधड़ी हीटमैप",
    tab_pdf: "📄 पीडीएफ विश्लेषक",
    active_schemes: "सक्रिय योजनाएं",
    categories: "श्रेणियाँ",
    languages: "भाषाएं",
    fraud_protection: "धोखाधड़ी सुरक्षा",
    apply_now: "अभी आवेदन करें →",
    eligibility_score: "आपकी पात्रता स्कोर",
    sync_live: "📊 लाइव सिंक",
    my_profile: "👤 मेरी प्रोफ़ाइल",
    view_profile: "प्रोफ़ाइल देखें",
    logout: "लॉग आउट",
    login: "Google से लॉगिन करें",
    language_header: "🌐 भाषा",
    filters_header: "🔍 फिल्टर्स"
  },
  'मराठी': {
    title: "तुमचा सरकारी लाभ शोधा",
    subtitle: "तुमच्या भाषेत लगेचच तुम्ही पात्र असलेल्या योजना शोधा.",
    tab_browse: "📋 योजना शोधा",
    tab_ai: "🤖 AI सहाय्यक + व्हॉइस",
    tab_fraud: "🗺️ फसवणूक हीटमॅप",
    tab_pdf: "📄 PDF विश्लेषक",
    active_schemes: "सक्रिय योजना",
    categories: "श्रेण्या",
    languages: "भाषा",
    fraud_protection: "फसवणूक संरक्षण",
    apply_now: "आता अर्ज करा →",
    eligibility_score: "तुमचा पात्रता स्कोअर",
    sync_live: "📊 लाइव्ह सिंक",
    my_profile: "👤 माझी प्रोफाईल",
    view_profile: "प्रोफाईल पहा",
    logout: "लॉगआउट",
    login: "Google सह लॉग इन करा",
    language_header: "🌐 भाषा",
    filters_header: "🔍 फिल्टर्स"
  },
  'தமிழ்': {
    title: "உங்கள் அரசு நன்மையை கண்டறியவும்",
    subtitle: "உங்களுக்கு உரிமையான திட்டங்களை — உங்கள் மொழியில், உடனடியாக கண்டறியவும்.",
    tab_browse: "📋 திட்டங்களை உலாவு",
    tab_ai: "🤖 AI உதவியாளர் + குரல்",
    tab_fraud: "🗺️ மோசடி வெப்ப வரைபடம்",
    tab_pdf: "📄 PDF வழிகாட்டி",
    active_schemes: "செயலில் உள்ள திட்டங்கள்",
    categories: "வகைகள்",
    languages: "மொழிகள்",
    fraud_protection: "மோசடி பாதுகாப்பு",
    apply_now: "இப்போது விண்ணப்பிக்கவும் →",
    eligibility_score: "உங்கள் தகுதி மதிப்பெண்",
    sync_live: "📊 நேரடி சுருக்கம்",
    my_profile: "👤 என் சுயவிவரம்",
    view_profile: "சுயவிவரத்தைக் காண்க",
    logout: "வெளியேறு",
    login: "Google உடன் உள்நுழைக",
    language_header: "🌐 மொழி",
    filters_header: "🔍 திட்ட வடிப்பான்கள்"
  },
  'తెలుగు': {
    title: "మీ ప్రభుత్వ ప్రయోజనాన్ని కనుగొనండి",
    subtitle: "మీకు అర్హత ఉన్న పథకాలను — మీ భాషలో, తక్షణమే కనుగొనండి.",
    tab_browse: "📋 పథకాలను బ్రౌజ్ చేయండి",
    tab_ai: "🤖 AI అసిస్టెంట్ + వాయిస్",
    tab_fraud: "🗺️ మోసాల హీట్‌మ్యాప్",
    tab_pdf: "📄 PDF విశ్లేషకుడు",
    active_schemes: "క్రియాశీల పథకాలు",
    categories: "కేటగిరీలు",
    languages: "భాషలు",
    fraud_protection: "మోసం రక్షణ",
    apply_now: "ఇప్పుడే దరఖాస్తు చేసుకోండి →",
    eligibility_score: "మీ అర్హత స్కోరు",
    sync_live: "📊 లైవ్ సింక్",
    my_profile: "👤 నా ప్రొఫైల్",
    view_profile: "ప్రొఫైల్ చూడండి",
    logout: "లాగ్అవుట్",
    login: "Google తో లాగిన్ చేయండి",
    language_header: "🌐 భాష",
    filters_header: "🔍 ఫిల్టర్లు"
  }
};

// Auth Callback Component
function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading, checkOnboardedStatus } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!loading && user) {
        const urlParams = new URLSearchParams(window.location.search);
        const fromDataCollection = urlParams.get('from') === 'datacollection';

        if (fromDataCollection) {
          // Coming from data collection, user is onboarded
          navigate('/');
          return;
        }

        const isOnboarded = await checkOnboardedStatus(user.id);
        if (!isOnboarded) {
          window.location.href = 'http://localhost:5173';
          return;
        }
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [loading, user, navigate, checkOnboardedStatus]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '18px'
    }}>
      Completing authentication...
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
  const [uploadStatus, setUploadStatus] = useState('');
  const [pdfInsights, setPdfInsights] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setUploadStatus('uploading');
    setPdfInsights('');

    const formData = new FormData();
    // Re-use logic for image or pdf, we call the field 'document'
    formData.append('document', file);

    try {
      const res = await fetch('http://localhost:5000/api/ocr/analyze-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPdfInsights(data.insights);
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch (err) {
      setUploadStatus('error');
      console.error(err);
    }
  };

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
  if (!category) return '#003366'; // add this line at the top
  const colors = {
    'Farmers': '#2d5a3d',
    // ... rest stays the same
  };
  return colors[category] || '#003366';
  };


  const handleApply = (e, scheme) => {
    e.preventDefault();
    setWhatsappStatus('processing');
    setTimeout(() => {
      setWhatsappStatus('done');
      setTimeout(() => {
        setWhatsappStatus(null);
      }, 5000);
    }, 2000);
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className={`app ${isHighContrast ? 'high-contrast' : ''}`} style={{ fontSize: `${16 * fontSizeMultiplier}px` }}>
          {/* Top Banner */}
          <div className="top-banner">
            🇮🇳 भारत सरकार | Government of India | LOKSEVA — Powered by Firecrawl · Gemini · LangGraph
          </div>

          <div className="app-container">
            {/* Left Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <div className="logo">🏛️</div>
                <h1>LOKSEVA</h1>
                <p>Smart Scheme Finder for Every Citizen</p>
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
                  <button className="login-btn" onClick={signInWithGoogle}>
                    {t('login')}
                  </button>
                )}
              </div>

              {/* Data Sync */}
              <div className="sidebar-section">
                <h3>☁️ DATA SYNC</h3>
               <button
                  type="button"
                  className="sync-btn"
                  disabled={isLoading}
                  onClick={syncSchemes}
              >
                {isLoading ? "🔄 Syncing..." : t('sync_live')}
              </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
              {/* Header with Stats */}
              <div className="main-header">
                <div className="header-left">
                  <h1>LOKSEVA</h1>
                  <p>सरकारी योजना खोजें | Government Scheme Finder</p>
                </div>
              </div>

              {/* Hero Section */}
              <section className="hero-section">
                <h2>🏛️ {t('title')}</h2>
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
                  className={`tab ${activeTab === 'fraud' ? 'active' : ''}`}
                  onClick={() => setActiveTab('fraud')}
                >
                  📰 Taaza Khabar
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
                          <div className="card-header" style={{ backgroundColor: getCategoryColor(scheme.category) }}>
                            <div className="card-category">⭐ {scheme.category?.toUpperCase() || 'GENERAL'}</div>
                            <h3 className="card-title">{scheme.scheme_name}</h3>
                          </div>
                          <div className="card-body">
                            <p className="card-summary">{scheme.summary}</p>
                            <div className="card-meta">
                              <span className="meta-tag">📍 {scheme.state}</span>
                              <span className="meta-tag">💰 {scheme.income_level}</span>
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
                  <h3>🤖 {t('tab_ai')}</h3>
                  <p>Chat with our AI assistant or use voice search to find schemes.</p>
                </div>
              )}

              {/* PDF Parsing Wizard Tab */}
              {activeTab === 'pdf' && (
                <div className="tab-content pdf-wizard">
                  <div className="fraud-header">
                    <div>
                      <h3><FileText size={28} color="#003366" /> AI Policy PDF & Image Analyzer</h3>
                      <p>Drop a confusing government policy PDF or Image here. Our AI will instantly extract your eligibility and benefits.</p>
                    </div>
                  </div>
                  <div className="pdf-dropzone" style={{ position: 'relative', overflow: 'hidden' }}>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={handleFileUpload} 
                      style={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                        opacity: 0, cursor: 'pointer', zIndex: 10 
                      }} 
                    />
                    <UploadCloud size={64} color="#a0aec0" className="upload-icon" />
                    <h4>Drag & Drop Policy PDF / Image</h4>
                    <p>Maximum file size: 10MB</p>
                    <button className="btn-upload" style={{ pointerEvents: 'none' }}>
                      {uploadStatus === 'uploading' ? 'Analyzing...' : 'Browse Files'}
                    </button>
                  </div>

                  {uploadStatus === 'uploading' && (
                    <div className="loading-state" style={{ marginTop: '20px', textAlign: 'center' }}>
                      <div className="spinner"></div>
                      <p>Our AI is analyzing the document using OCR...</p>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="error-state" style={{ marginTop: '20px', color: 'red', textAlign: 'center' }}>
                      <p>Failed to analyze document. Please make sure the backend is running.</p>
                    </div>
                  )}

                  {uploadStatus === 'success' && pdfInsights && (
                    <div className="scanned-insights" style={{ marginTop: '20px', background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h4>AI Extracted Insights</h4>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: '10px' }}>
                        {pdfInsights}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'fraud' && (
                <div className="tab-content taaza-dashboard">
                  <div className="fraud-header">
                    <div>
                      <h3>📰 Taaza Khabar</h3>
                      <p>Latest updates and dummy news regarding government schemes in India.</p>
                    </div>
                  </div>

                  <div className="taaza-khabar-container">
                    {taazaKhabarNews.map((news, index) => (
                      <div 
                        key={news.id} 
                        className="news-item" 
                        style={{ animationDelay: `${index * 0.15}s` }}
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
                    <h4 style={{marginTop: '16px'}}>Application Successful!</h4>
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
      }/>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;