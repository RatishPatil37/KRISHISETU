import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import Profile from "./Pages/Profile";
import VapiChatAssistant from './components/VapiChatAssistant';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  AlertTriangle, ShieldX, Activity, Settings, Type, CheckCircle, UploadCloud, FileText, 
  Sun, Moon, MessageCircle, Smartphone, Download, Filter, Search, RefreshCcw, 
  ClipboardList, FileSearch, CalendarDays, IndianRupee, CircleHelp, CheckCircle2, 
  Scale, Zap, Sparkles, Shield, Shuffle, MapPin, Home, User, ArrowRight, ArrowLeft, X,
  Building2, Building, Sprout, Landmark, Mail, Inbox, Folder, BookOpen, Bot, Lightbulb, Flame, Newspaper, Database
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import LocationMap from './components/LocationMap';
import CropDoctor from './components/CropDoctor';
import MSPTracker from './components/MSPTracker';
import Marketplace from './Pages/Marketplace';

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
    taaza_desc: "Latest notifications and news regarding government schemes in India.",
    tab_crop_doctor: "AI Crops Doctor",
    tab_msp: "MSP Tracker",
    tab_marketplace: "Community Marketplace",
    market_title: "Community Marketplace",
    market_subtitle: "Direct from farmers to you. Zero commission.",
    list_produce: "List My Produce",
    loading_market: "Loading marketplace...",
    no_products: "No products found in this category. Be the first to list!",
    your_listing: "Your Listing",
    call: "Call",
    whatsapp: "WhatsApp",
    remove: "Remove",
    confirm_delete: "Are you sure you want to delete this listing?",
    list_your_produce: "List Your Produce",
    product_name: "Product Name",
    category: "Category",
    quantity: "Quantity Available",
    price: "Price (₹)",
    unit: "Unit",
    location: "Location",
    product_image: "Product Image",
    upload_photo: "Upload Product Photo",
    image_selected: "Image Selected",
    description: "Full Description",
    cancel: "Cancel",
    post_listing: "Post Listing",
    ai_assistant: "AI Assistant",
    start_voice: "Start Voice",
    end_call: "End Call",
    type_here: "Type here...",
    voice_off_msg: "Turn on Voice to start chatting",
    vapi_error: "Connecting (Please allow microphone)..."
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
    taaza_desc: "भारत में सरकारी योजनाओं के बारे में नवीनतम सूचनाएं और समाचार।",
    tab_crop_doctor: "एआई फसल डॉक्टर",
    tab_msp: "एमएसपी ट्रैकर",
    tab_marketplace: "सामुदायिक बाज़ार",
    market_title: "सामुदायिक बाज़ार",
    market_subtitle: "किसानों से सीधे आप तक। शून्य कमीशन।",
    list_produce: "अपनी उपज सूचीबद्ध करें",
    loading_market: "बाज़ार लोड हो रहा है...",
    no_products: "इस श्रेणी में कोई उत्पाद नहीं मिला। पहले आप सूचीबद्ध करें!",
    your_listing: "आपकी सूची",
    call: "कॉल करें",
    whatsapp: "व्हाट्सएप",
    remove: "हटाएं",
    confirm_delete: "क्या आप वाकई इस सूची को हटाना चाहते हैं?",
    list_your_produce: "अपनी उपज सूचीबद्ध करें",
    product_name: "उत्पाद का नाम",
    category: "श्रेणी",
    quantity: "उपलब्ध मात्रा",
    price: "कीमत (₹)",
    unit: "इकाई",
    location: "स्थान",
    product_image: "उत्पाद की छवि",
    upload_photo: "उत्पाद फोटो अपलोड करें",
    image_selected: "छवि चयनित",
    description: "पूरा विवरण",
    cancel: "रद्द करें",
    post_listing: "सूची पोस्ट करें",
    ai_assistant: "एआई सहायक",
    start_voice: "आवाज शुरू करें",
    end_call: "कॉल समाप्त करें",
    type_here: "यहाँ टाइप करें...",
    voice_off_msg: "चैट शुरू करने के लिए आवाज चालू करें",
    vapi_error: "जुड़ रहा है (कृपया माइक्रोफ़ोन की अनुमति दें)..."
  },
  'मराठी': {
    title: "तुमचा सरकारी लाभ शोधा",
    subtitle: "तुमच्या भाषेत लगेचच तुम्ही पात्र असलेल्या योजना शोधा.",
    tab_browse: "योजना शोधा",
    tab_ai: "AI सहाय्यक + व्हॉइस",
    tab_fraud: "फसवणूक हीटमॅप",
    tab_pdf: "PDF विश्లేषक",
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
    taaza_desc: "भारतातील सरकारी योजनांबद्दलच्या नवीनतम सूचना आणि बातम्या.",
    tab_crop_doctor: "एआई पीक डॉक्टर",
    tab_msp: "एमएसपी ट्रॅकर",
    tab_marketplace: "सामुदायिक बाजार",
    market_title: "सामुदायिक बाजार",
    market_subtitle: "शेतकऱ्यांकडून थेट तुमच्यापर्यंत. शून्य कमिशन.",
    list_produce: "माझी उपज सूचीबद्ध करा",
    loading_market: "बाजार लोड होत आहे...",
    no_products: "या श्रेणीमध्ये कोणतीही उत्पादने आढळली नाहीत. सूचीबद्ध करणारे पहिले व्हा!",
    your_listing: "तुमची सूची",
    call: "कॉल करा",
    whatsapp: "व्हॉट्सॲप",
    remove: "काढून टाका",
    confirm_delete: "तुम्हाला खात्री आहे की तुम्ही ही सूची हटवू इच्छिता?",
    list_your_produce: "तुमची उपज सूचीबद्ध करा",
    product_name: "उत्पादनाचे नाव",
    category: "श्रेणी",
    quantity: "उपलब्ध प्रमाण",
    price: "किंमत (₹)",
    unit: "एकक",
    location: "स्थान",
    product_image: "उत्पादनाची प्रतिमा",
    upload_photo: "उत्पादन फोटो अपलोड करा",
    image_selected: "प्रतिमा निवडली",
    description: "पूर्ण वर्णन",
    cancel: "रद्द करा",
    post_listing: "सूची पोस्ट करा",
    ai_assistant: "AI सहाय्यक",
    start_voice: "आवाज सुरू करा",
    end_call: "कॉल समाप्त करा",
    type_here: "येथे टाइप करा...",
    voice_off_msg: "चॅटिंग सुरू करण्यासाठी आवाज चालू करा",
    vapi_error: "कनेक्ट होत आहे (कृपया मायक्रोफोनला परवानगी द्या)..."
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
    taaza_desc: "இந்தியாவில் உள்ள அரசு திட்டங்கள் குறித்த சமீபத்திய அறிவிப்புகள் மற்றும் செய்திகள்.",
    tab_crop_doctor: "AI பயிர் மருத்துவர்",
    tab_msp: "MSP டிராக்கர்",
    tab_marketplace: "சமூக சந்தை",
    market_title: "சமூக சந்தை",
    market_subtitle: "விவசாயிகளிடமிருந்து நேரடியாக உங்களுக்கு. பூஜ்ஜிய கமிஷன்.",
    list_produce: "எனது விளைபொருட்களை பட்டியலிடுங்கள்",
    loading_market: "சந்தை ஏற்றப்படுகிறது...",
    no_products: "இந்த பிரிவில் எந்த தயாரிப்புகளும் காணப்படவில்லை. முதலில் பட்டியலிடுங்கள்!",
    your_listing: "உங்கள் பட்டியல்",
    call: "அழைப்பு",
    whatsapp: "வாட்ஸ்அப்",
    remove: "நீக்கு",
    confirm_delete: "இந்த பட்டியலை நிச்சயமாக நீக்க விரும்புகிறீர்களா?",
    list_your_produce: "உங்கள் விளைபொருட்களை பட்டியலிடுங்கள்",
    product_name: "தயாரிப்பு பெயர்",
    category: "வகை",
    quantity: "கிடைக்கும் அளவு",
    price: "விலை (₹)",
    unit: "அலகு",
    location: "இடம்",
    product_image: "தயாரிப்பு படம்",
    upload_photo: "தயாரிப்பு புகைப்படத்தை பதிவேற்றவும்",
    image_selected: "படம் தேர்ந்தெடுக்கப்பட்டது",
    description: "முழு விளக்கம்",
    cancel: "ரத்து செய்",
    post_listing: "பட்டியலை இடுங்கள்",
    ai_assistant: "AI உதவியாளர்",
    start_voice: "குரலைத் தொடங்கு",
    end_call: "அழைப்பை முடி",
    type_here: "இங்கே தட்டச்சு செய்க...",
    voice_off_msg: "அரட்டையடிக்க குரலை இயக்கவும்",
    vapi_error: "இணைகிறது (தயவுசெய்து மைக்ரோஃபோனை அனுமதிக்கவும்)..."
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
    taaza_desc: "భారతదేశంలో ప్రభుత్వ పథకాలకు సంబంధించిన తాజా నోటిఫికేషన్‌లు మరియు వార్తలు.",
    tab_crop_doctor: "AI పంటల డాక్టర్",
    tab_msp: "MSP ట్రాకర్",
    tab_marketplace: "కమ్యూనిటీ మార్కెట్ ప్లేస్",
    market_title: "కమ్యూనిటీ మార్కెట్ ప్లేస్",
    market_subtitle: "రైతుల నుండి నేరుగా మీకు. సున్నా కమిషన్.",
    list_produce: "నా ఉత్పత్తులను జాబితా చేయండి",
    loading_market: "మార్కెట్ లోడ్ అవుతోంది...",
    no_products: "ఈ వర్గంలో ఉత్పత్తులేవీ కనుగొనబడలేదు. మొదట జాబితా చేయండి!",
    your_listing: "మీ జాబితా",
    call: "కాల్",
    whatsapp: "వాట్సాప్",
    remove: "తొలగించు",
    confirm_delete: "మీరు ఖచ్చితంగా ఈ జాబితాను తొలగించాలనుకుంటున్నారా?",
    list_your_produce: "మీ ఉత్పత్తులను జాబితా చేయండి",
    product_name: "ఉత్పత్తి పేరు",
    category: "వర్గం",
    quantity: "అందుబాటులో ఉన్న పరిమాణం",
    price: "ధర (₹)",
    unit: "యూనిట్",
    location: "ప్రాంతం",
    product_image: "ఉత్పత్తి చిత్రం",
    upload_photo: "ఉత్పత్తి ఫోటోను అప్‌లోడ్ చేయండి",
    image_selected: "చిత్రం ఎంపிக చేయబడింది",
    description: "పూర్తి వివరణ",
    cancel: "రద్దు చేయి",
    post_listing: "జాబితాను పోస్ట్ చేయండి",
    ai_assistant: "AI అసిస్టెంట్",
    start_voice: "వాయిస్ ప్రారంభించు",
    end_call: "కాల్ ముగించు",
    type_here: "ఇక్కడ టైప్ చేయండి...",
    voice_off_msg: "చాటింగ్ ప్రారంభించడానికి వాయిస్‌ని ఆన్ చేయండి",
    vapi_error: "కనెక్ట్ అవుతోంది (దయచేసి మైక్రోఫోన్‌ని అనుమతించండి)..."
  }
};

// Auth Callback Component
function AuthCallback() {
  const { checkOnboardedStatus } = useAuth();
  const [status, setStatus] = useState("Completing authentication...");
  const [isError, setIsError] = useState(false);
  const hasRun = React.useRef(false);

  // Read app URLs from env — no hardcoded localhost
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
  const APP_URL  = `${BASE_URL}/app`;

  useEffect(() => {
    // Guard: only run once even if deps change due to context re-renders
    if (hasRun.current) return;
    hasRun.current = true;

    let cancelled = false;

    const handleCallback = async () => {
      try {
        // Step 1: Extract tokens from URL hash (implicit flow fallback)
        const rawHash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);
        const access_token  = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        let resolvedUser = null;

        if (access_token && refresh_token) {
          // Explicitly set session when tokens arrive in the URL hash
          setStatus("Setting up your session...");
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          resolvedUser = data?.user ?? null;
          // Clean the hash from the URL without triggering a reload
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          // PKCE flow: Supabase (with detectSessionInUrl: true) already exchanged
          // the code for a session — just retrieve it
          setStatus("Verifying your session...");
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          resolvedUser = data?.session?.user ?? null;
        }

        if (cancelled) return;

        if (!resolvedUser) {
          // No valid session — send back to landing page
          window.location.href = BASE_URL;
          return;
        }

        setStatus("Checking your profile...");
        const isOnboarded = await checkOnboardedStatus(resolvedUser.email);
        if (cancelled) return;

        // Route: new user → profile setup, returning user → main app
        window.location.href = isOnboarded
          ? APP_URL
          : `${BASE_URL}/app/profile`;

      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        if (!cancelled) {
          setIsError(true);
          setStatus(`Authentication failed: ${err.message}. Redirecting...`);
          setTimeout(() => { window.location.href = APP_URL; }, 3000);
        }
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, []); // empty deps — run once on mount only

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#0f2518', color: '#fff', fontFamily: 'sans-serif', gap: '16px'
    }}>
      {!isError && (
        <div style={{
          width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid #48bb78', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      )}
      <p style={{ fontSize: 16, color: isError ? '#fc8181' : '#a0aec0', textAlign: 'center', maxWidth: 320 }}>
        {status}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


function App() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && !user && !window.location.pathname.includes('/auth/callback')) {
      window.location.href = (process.env.REACT_APP_BASE_URL || 'http://localhost:5000') + '/';
    }
  }, [user, authLoading]);

  // Schemes start empty — loaded from DB on mount via useEffect, updated via Sync button
  const [schemes, setSchemes] = useState([]);

  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(''); // feedback after sync
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedIncome, setSelectedIncome] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  // New Feature States
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Translation Helper
  const t = (key) => DICTIONARY[selectedLanguage]?.[key] || DICTIONARY['English'][key] || key;

  // Taaza Khabar State — Paginated
  const [taazaKhabarNews, setTaazaKhabarNews] = useState([]);
  const [newsPage, setNewsPage] = useState(1);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);

  // OCR Document Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // '' | 'uploading' | 'success' | 'error'
  const [pdfInsights, setPdfInsights] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0=idle,1=uploading,2=ocr,3=gemini,4=done
  const [syncStatus, setSyncStatus] = useState(''); // '' | 'syncing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [eligibleSchemeNames, setEligibleSchemeNames] = useState([]);
  const [hardcodedSchemes, setHardcodedSchemes] = useState([]);

  const runOcr = async (file) => {
    setSelectedFile(file);
    setUploadStatus('uploading');
    setPdfInsights('');
    setErrorMessage('');
    setScanStep(1);

    const formData = new FormData();
    formData.append('document', file);

    // Simulate step progression for UX
    const stepTimer1 = setTimeout(() => setScanStep(2), 800);  // OCR
    const stepTimer2 = setTimeout(() => setScanStep(3), 2000); // Gemini

    try {
      const res = await fetch('/api/ocr/analyze-image', {
        method: 'POST',
        body: formData,
      });
      clearTimeout(stepTimer1); clearTimeout(stepTimer2);
      const data = await res.json();
      if (data.success) {
        setPdfInsights(data.insights);
        setExtractedData(data.extractedData);
        setEligibleSchemeNames(data.eligibleSchemes || []);
        setHardcodedSchemes(data.hardcodedSchemes || []);
        setScanStep(4);
        setUploadStatus('success');
      } else {
        setErrorMessage(data.error || 'Document Analysis Failed');
        setScanStep(0);
        setUploadStatus('error');
      }
    } catch (err) {
      clearTimeout(stepTimer1); clearTimeout(stepTimer2);
      setErrorMessage(err.message || 'Connection to backend failed');
      setScanStep(0);
      setUploadStatus('error');
      console.error(err);
    }
  };

  const handleSyncProfile = async () => {
    if (!user?.id) {
      alert("No user session found. Please sign in first.");
      return;
    }
    if (!extractedData) {
      alert("No document data to sync. Please upload a document first.");
      return;
    }
    setSyncStatus('syncing');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    try {
      const res = await fetch('/api/ocr/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.id, extractedData }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
        alert(data.error || 'Sync failed. Please try again.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setSyncStatus('error');
      if (err.name === 'AbortError') {
        alert('Sync timed out. Please check your connection and try again.');
      } else {
        console.error('Sync error:', err);
        alert('Sync failed: ' + err.message);
      }
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
  const [mapSearchQuery, setMapSearchQuery] = useState('government+offices');

  useEffect(() => {
    if (activeTab === 'location' && !locationParams) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationParams({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          (error) => {
            console.error("Error getting location", error);
            setLocationParams({ lat: 28.6139, lng: 77.2090 });
          }
        );
      }
    }
  }, [activeTab]);

  // Fetch user profile from MongoDB to sync filters and UI highlights
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`/api/users/profile?uid=${user.id}`);
          const data = await res.json();
          if (data.success && data.user) {
            setUserProfile(data.user);
            // Auto-set income level filter if profile has it (category now)
            if (data.user.income_category) {
              setSelectedIncome(data.user.income_category);
            } else if (data.user.income_level) {
              setSelectedIncome(data.user.income_level);
            }
          }
        } catch (err) {
          console.error("Error fetching profile for filters:", err);
        }
      }
    };
    fetchProfile();
  }, [user, syncStatus]);

  // ── Load schemes from DB on mount ────────────────────────────────────────
  useEffect(() => {
    const loadSchemesFromDB = async () => {
      try {
        setIsLoading(true);
        const [schemesRes, newsRes] = await Promise.all([
          fetch('/api/schemes').catch(() => ({ ok: false })),
          fetch('/api/firecrawl/news?page=1&limit=10').catch(() => ({ ok: false }))
        ]);

        if (schemesRes.ok) {
          const sData = await schemesRes.json();
          if (Array.isArray(sData) && sData.length > 0) {
            setSchemes(sData);
            setSyncMessage(`✅ Loaded ${sData.length} schemes from database`);
          } else {
            setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Inbox size={16} /> No schemes in database yet. Click "Sync Live Schemes" to fetch.</span>);
          }
        }

        if (newsRes.ok) {
          const nData = await newsRes.json();
          if (nData.success && Array.isArray(nData.news)) {
            setTaazaKhabarNews(nData.news);
            setHasMoreNews(nData.hasMore ?? false);
            setNewsPage(1);
          }
        }

      } catch (err) {
        console.error('Failed to load schemes from DB:', err);
        setSyncMessage('⚠️ Could not reach backend. Check if server is running.');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) loadSchemesFromDB(); // only load once user session is confirmed
  }, [user]);

  // ── Load More News (Paginated) ─────────────────────────────────────────────
  const loadMoreNews = async () => {
    if (newsLoading || !hasMoreNews) return;
    setNewsLoading(true);
    try {
      const nextPage = newsPage + 1;
      const res = await fetch(`/api/firecrawl/news?page=${nextPage}&limit=10`);
      const data = await res.json();
      if (data.success && Array.isArray(data.news) && data.news.length > 0) {
        setTaazaKhabarNews(prev => [...prev, ...data.news]);
        setHasMoreNews(data.hasMore ?? false);
        setNewsPage(nextPage);
      } else {
        setHasMoreNews(false);
      }
    } catch (err) {
      console.error('Failed to load more news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  // ── Sync ONLY News (Fast RSS Sync) ────────────────────────────────────────
  const [isSyncingNews, setIsSyncingNews] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});

  // Sync tab indicator position when activeTab or language changes
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth
      });
    }
  }, [activeTab, selectedLanguage]);
  const syncNews = async () => {
    if (isSyncingNews) return;
    setIsSyncingNews(true);
    try {
      const res = await axios.post('/api/firecrawl/news/refresh');
      if (res.data.success) {
        setTaazaKhabarNews(res.data.news);
        setNewsPage(1);
        setHasMoreNews(res.data.news.length >= 10);
        setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> News feed refreshed successfully!</span>);
      }
    } catch (err) {
      console.error('Failed to sync news:', err);
      setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldX size={16} /> News refresh failed. Check internet connection.</span>);
    } finally {
      setTimeout(() => setIsSyncingNews(false), 1000); // Animation buffer
    }
  };

  // ── Sync schemes via Firecrawl + Gemini + trigger WhatsApp ───────────────
  const syncSchemes = async () => {
    try {
      setIsLoading(true);
      setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCcw size={16} className="spinning" /> Scraping live schemes...</span>);
      const uid = user?.id ?? '';
      const res = await fetch(`/api/firecrawl/sync?uid=${uid}`);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.schemes)) {
        if (data.schemes.length > 0) {
          setSchemes(data.schemes);
        }
        // Also force-refresh news from sync response
        if (Array.isArray(data.news) && data.news.length > 0) {
          setTaazaKhabarNews(data.news);
          setNewsPage(1);
          setHasMoreNews(data.news.length >= 10);
        }

        if (data.source === 'firecrawl') {
          setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> Discovery Success! Scraped {data.scraped_count} fresh schemes.</span>);
        } else if (data.source === 'pib_fallback') {
          setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} /> Backup Active: Synced {data.scraped_count} official announcements from PIB.</span>);
        } else {
          setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={16} /> Dynamic Mode: Schemes rearranged & News feed refreshed.</span>);
        }
      } else {
        setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} /> Sync completed with cached data.</span>);
      }
    } catch (error) {
      console.error('[syncSchemes] error:', error);
      setSyncMessage(<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldX size={16} /> Sync failed: {error.message}</span>);
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
  }, [schemes, selectedCategory, selectedState, selectedIncome, searchQuery]);

  const filterSchemes = () => {
    let filtered = schemes;

    if (selectedCategory) {
      filtered = filtered.filter(scheme => scheme.category === selectedCategory);
    }

    if (selectedState) {
      filtered = filtered.filter(scheme => scheme.state === selectedState || scheme.state === 'All India');
    }

    if (selectedIncome && selectedIncome !== 'All') {
      filtered = filtered.filter(scheme => scheme.income_level === selectedIncome || scheme.income_level === 'All');
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(scheme => 
        (scheme.scheme_name && scheme.scheme_name.toLowerCase().includes(q)) || 
        (scheme.summary && scheme.summary.toLowerCase().includes(q)) ||
        (scheme.category && scheme.category.toLowerCase().includes(q)) 
      );
    }

    setFilteredSchemes(filtered);
  };

  // Compute eligibility status for a scheme based on user profile
  const getEligibilityStatus = (scheme) => {
    if (!userProfile) return { status: 'unknown', label: '❓ Login to Check', color: '#888' };
    let score = 0;
    let total = 0;
    let reasons = [];

    // Income match
    total++;
    if (scheme.income_level === 'All' || scheme.income_level === userProfile.income_category) {
      score++;
      reasons.push('Income matches');
    } else {
      reasons.push('Income: requires ' + scheme.income_level);
    }

    // State match
    total++;
    const userState = userProfile.district ? 'Maharashtra' : 'All India'; // Infer from district
    if (scheme.state === 'All India' || scheme.state === userState) {
      score++;
      reasons.push('State matches');
    } else {
      reasons.push('State: requires ' + scheme.state);
    }

    // Farmer category - check if user has land/survey
    if (scheme.category === 'Farmers') {
      total++;
      if (userProfile.survey_number || userProfile.land_area) {
        score++;
        reasons.push('Land record on file');
      } else {
        reasons.push('No land record — sync 7/12 via PDF Wizard');
      }
    }

    const pct = Math.round((score / total) * 100);
    if (pct >= 80) return { status: 'eligible', label: '✅ Eligible', color: '#276749', pct, reasons };
    if (pct >= 50) return { status: 'partial', label: '⚠️ Partially Eligible', color: '#b7791f', pct, reasons };
    return { status: 'not_eligible', label: '❌ Not Eligible', color: '#c53030', pct, reasons };
  };

  const categories = ['Farmers', 'Women', 'Business', 'Education', 'Health', 'Senior Citizens', 'Youth', 'Housing', 'General'];
  const states = ['All India', 'Punjab', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'Karnataka', 'Rajasthan', 'Delhi'];
  const incomes = ['All', 'Backward Class', 'Middle Class', 'Higher Class'];
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

  // ── Auth Guards: prevent dashboard flash for unauthenticated users ────────
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: '#0f2518', color: '#fff', fontFamily: 'sans-serif', gap: '16px'
      }}>
        <div style={{
          width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid #48bb78', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: 14, color: '#a0aec0' }}>Loading KrishiSetu...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not authenticated and not on auth callback, render nothing while redirect fires
  if (!user && !window.location.pathname.includes('/auth/callback')) {
    return null;
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`} style={{ fontSize: `${16 * fontSizeMultiplier}px` }}>
      <Routes>
        <Route path="/" element={
          <>
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

              <div className="sidebar-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={14} /> {t('my_profile')}
                </h3>
                {user ? (
                  <>
                    <p className="user-email name">
                      {userProfile?.name || userProfile?.full_name || 'Farmer'}
                    </p>
                    <p className="user-email sub">{user.email}</p>
                    
                    <div className="profile-info-box">
                      {(userProfile?.income_category || userProfile?.incomeClass) && (
                        <div className="profile-info-row">
                          <span className="profile-info-label income" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IndianRupee size={12} /> Income:
                          </span>
                          <span className="profile-info-text">{userProfile.incomeClass || userProfile.income_category}</span>
                        </div>
                      )}
                      {userProfile?.district && (
                        <div className="profile-info-row">
                          <span className="profile-info-label dist" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={12} /> District:
                          </span>
                          <span className="profile-info-text">{userProfile.district}</span>
                        </div>
                      )}
                      {(userProfile?.village || userProfile?.location || userProfile?.taluka) && (
                        <div className="profile-info-row">
                          <span className="profile-info-label loc" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Home size={12} /> Location:
                          </span>
                          <span className="profile-info-text">{userProfile.village || userProfile.location || ''} {userProfile.taluka ? `(${userProfile.taluka})` : ''}</span>
                        </div>
                      )}
                      {userProfile?.survey_number && (
                        <div className="profile-info-row">
                          <span className="profile-info-label survey" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={12} /> Survey:
                          </span>
                          <span className="profile-info-text">{userProfile.survey_number}</span>
                        </div>
                      )}
                    </div>
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
                {syncMessage && <p style={{fontSize: 13, color: '#48bb78', marginTop: 8}}>{syncMessage}</p>}
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
                    <span>18+</span> {t('active_schemes')}
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

              {/* Tabs with Glide Animation */}
              <div className="tabs">
                <button
                  ref={el => tabRefs.current['browse'] = el}
                  className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
                  onClick={() => setActiveTab('browse')}
                >
                  {t('tab_browse')}
                </button>
                <button
                  ref={el => tabRefs.current['assistant'] = el}
                  className={`tab ${activeTab === 'assistant' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assistant')}
                >
                  {t('tab_ai')}
                </button>
                <button
                  ref={el => tabRefs.current['pdf'] = el}
                  className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pdf')}
                >
                  {t('tab_pdf')}
                </button>
                <button
                  ref={el => tabRefs.current['location'] = el}
                  className={`tab ${activeTab === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveTab('location')}
                >
                  {t('tab_location')}
                </button>
                <button
                  ref={el => tabRefs.current['fraud'] = el}
                  className={`tab ${activeTab === 'fraud' ? 'active' : ''}`}
                  onClick={() => setActiveTab('fraud')}
                >
                  {t('tab_taaza')}
                </button>
                <button
                  ref={el => tabRefs.current['crop-doctor'] = el}
                  className={`tab ${activeTab === 'crop-doctor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('crop-doctor')}
                >
                  🌿 {t('tab_crop_doctor')}
                </button>
                <button
                  ref={el => tabRefs.current['msp'] = el}
                  className={`tab ${activeTab === 'msp' ? 'active' : ''}`}
                  onClick={() => setActiveTab('msp')}
                >
                  📊 {t('tab_msp')}
                </button>
                <button
                  ref={el => tabRefs.current['marketplace'] = el}
                  className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`}
                  onClick={() => setActiveTab('marketplace')}
                >
                  🏪 {t('tab_marketplace')}
                </button>
                {/* Floating Glide Indicator */}
                <div className="tab-indicator" style={indicatorStyle}></div>
              </div>

              {/* Available Schemes */}
              {activeTab === 'browse' && (
                <div className="schemes-container">
                  
                  {/* Search Bar UI */}
                  <div className="search-bar-container">
                    <div className="scheme-search-bar">
                      <Search className="search-icon" size={20} />
                      <input
                        type="text"
                        placeholder="Search for schemes (e.g., Tractor, Health, Student)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search schemes"
                      />
                    </div>
                  </div>

                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ClipboardList size={22} color="#198754" />
                    Available Schemes ({filteredSchemes.length})
                  </h3>
                  {isLoading ? (
                    <div className="loading">Loading schemes...</div>
                  ) : filteredSchemes.length > 0 ? (
                    <div className="schemes-grid">
                      {filteredSchemes.map((scheme) => {
                        const elig = getEligibilityStatus(scheme);
                        return (
                          <div key={scheme._id} className="scheme-card">
                            <div className="card-header" style={{ background: getCategoryColor(scheme.category), borderTop: 'none', padding: '24px 24px 20px' }}>
                              <div className="card-category" style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Sparkles size={14} /> 
                                  {scheme.category?.toUpperCase() || 'GENERAL'}
                                </span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {elig.status === 'unknown' ? <CircleHelp size={12} /> : <CheckCircle2 size={12} />}
                                  {elig.label.replace(/❓|✅/, '')}
                                </span>
                              </div>
                              <h3 className="scheme-title" style={{ color: '#ffffff', fontSize: '1.3rem', margin: 0, fontWeight: 700, lineHeight: 1.3 }}>
                                <span style={{ color: 'white' }}>{scheme.scheme_name}</span>
                              </h3>
                            </div>
                            <div className="card-body">
                              <p className="card-summary">{scheme.summary}</p>
                              <div className="card-meta">
                                <span className="meta-tag">State: {scheme.state}</span>
                                <span className="meta-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <IndianRupee size={12} /> Income: {scheme.income_level}
                                </span>
                                {scheme.end_date && (
                                  <span className="meta-tag" style={{ color: scheme.end_date === 'Ongoing' ? '#276749' : '#c53030', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CalendarDays size={12} /> {scheme.end_date}
                                  </span>
                                )}
                              </div>
                              <div className="eligibility-score">
                                <div className="score-label">{t('eligibility_score')}: <strong>{scheme.eligibility_score}%</strong></div>
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${scheme.eligibility_score}%` }}></div>
                                </div>
                              </div>
                              {/* Eligibility reasons */}
                              {elig.reasons && (
                                <div className="eligibility-reasons-list">
                                  {elig.reasons.map((r, i) => <div key={i} className="eligibility-reason-text">• {r}</div>)}
                                </div>
                              )}
                              {/* Dual button row: Details + Apply Now */}
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={() => setDetailsModal(scheme)}
                                  className="btn-details"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={(e) => handleApply(e, scheme)}
                                  className="btn-apply"
                                  style={{ flex: 1, margin: 0 }}
                                >
                                  {t('apply_now')} →
                                </button>
                              </div>
                              {userProfile?.survey_number && scheme.category === 'Farmers' && (
                                <div className="farmer-survey-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <CheckCircle2 size={16} color="#198754" /> 
                                  <span>Survey No: <strong>{userProfile.survey_number}</strong> — Apply with synced 7/12 extract.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-schemes">No schemes found matching your filters.</div>
                  )}
                </div>
              )}

              {/* Details Modal */}
              {detailsModal && (
                <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header" style={{ background: getCategoryColor(detailsModal.category) }}>
                      <div className="modal-category">✦ {detailsModal.category?.toUpperCase()}</div>
                      <h2 className="modal-title">{detailsModal.scheme_name}</h2>
                    </div>
                    <div className="modal-body">
                      <p className="modal-summary">{detailsModal.summary}</p>

                      <div className="modal-sections-grid">
                        <div className="modal-section-box eligibility">
                          <h4 className="modal-section-title">
                            <Scale size={16} /> Eligibility Criteria
                          </h4>
                          <p className="modal-section-text">{detailsModal.eligibility_criteria}</p>
                        </div>
                        <div className="modal-section-box benefits">
                          <h4 className="modal-section-title">
                            <IndianRupee size={16} /> Benefits
                          </h4>
                          <p className="modal-section-text">{detailsModal.benefits}</p>
                        </div>
                        <div className="modal-section-box documents">
                          <h4 className="modal-section-title">
                            <FileText size={16} /> Documents Required
                          </h4>
                          <p className="modal-section-text">{detailsModal.required_documents || 'Aadhar Card, Income Certificate, Bank Account'}</p>
                        </div>
                        <div className="modal-stats-row">
                          <div className="modal-stat-box start-date">
                            <div className="stat-label">START DATE</div>
                            <div className="stat-value">{detailsModal.start_date || 'N/A'}</div>
                          </div>
                          <div className="modal-stat-box end-date">
                            <div className="stat-label">END DATE</div>
                            <div className="stat-value" style={{ color: detailsModal.end_date === 'Ongoing' ? '#276749' : '#c53030' }}>
                              {detailsModal.end_date || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button className="modal-close-btn" onClick={() => setDetailsModal(null)}>
                          Close
                        </button>
                        <button onClick={(e) => { handleApply(e, detailsModal); setDetailsModal(null); }}
                          className="btn-apply modal-apply-btn">
                          Apply Now <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
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
                      accept="image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileUpload}
                      disabled={uploadStatus === 'uploading'}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 10 }}
                    />
                    <UploadCloud size={56} color={isDragOver ? '#4a6cf7' : '#103567'} style={{ margin: '0 auto 14px', display: 'block', transition: 'color 0.2s' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#103567', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      {isDragOver ? <Folder size={20} /> : null}
                      {isDragOver ? 'Release to Scan' : 'Drag & Drop a PDF or Image'}
                    </h4>
                    <p style={{ color: '#777', fontSize: '0.88rem', margin: '0 0 16px' }}>Supports PDF, DOCX, Word, PNG, JPG, JPEG &bull; Max 20 MB</p>
                    <button
                      style={{
                        pointerEvents: 'none',
                        background: '#103567', color: '#fff',
                        border: 'none', borderRadius: '6px',
                        padding: '10px 28px', fontWeight: 600, fontSize: '0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      {uploadStatus === 'uploading' ? <RefreshCcw size={18} className="spinning" /> : 'Browse Files'}
                      {uploadStatus === 'uploading' ? ' Scanning...' : ''}
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
                        <FileSearch size={14} /> {selectedFile.name}
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
                      <p style={{ fontWeight: 700, color: '#103567', marginBottom: '16px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={18} className="spinning" /> Scanning Document...
                      </p>
                      {[
                        { step: 1, label: 'Uploading document to server', icon: <UploadCloud size={16} /> },
                        { step: 2, label: scanStep >= 2 && selectedFile?.name?.toLowerCase().endsWith('.pdf') ? 'Extracting text from PDF' : 'Running Tesseract.js OCR on image', icon: <BookOpen size={16} /> },
                        { step: 3, label: 'Sending to Gemini AI for analysis', icon: <Bot size={16} /> },
                      ].map(({ step, label, icon }) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', opacity: scanStep >= step ? 1 : 0.35, transition: 'opacity 0.4s' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                            {scanStep > step ? <CheckCircle2 size={18} color="#198754" /> : scanStep === step ? <RefreshCcw size={18} className="spinning" color="#103567" /> : icon}
                          </span>
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
                      <AlertTriangle size={24} color="#e53e3e" />
                      <div>
                        <p style={{ color: '#c53030', fontWeight: 700, margin: 0 }}>{errorMessage || 'Document Analysis Failed'}</p>
                        <p style={{ color: '#742a2a', fontSize: '0.87rem', marginTop: '4px' }}>
                          {errorMessage ? "Details: " + errorMessage : "Make sure the backend is running on port 5000 and the Gemini API key is set. Try a clearer image or a text-based PDF."}
                        </p>
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
                          <h2 style={{ color: '#103567', margin: '0 0 5px' }}>KRISHISETU OFFICIAL REPORT</h2>
                          <p style={{ margin: 0, color: '#555', fontWeight: 600 }}>Document Analysis & Scheme Recommendations</p>
                          <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '10px 0' }} />
                        </div>

                        {extractedData && (
                          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #103567', borderRadius: '8px', background: '#eef2ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, color: '#103567', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileSearch size={16} /> Extracted Profile Data
                              </h4>
                              {!syncStatus && (
                                <button
                                  onClick={handleSyncProfile}
                                  style={{ background: '#103567', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                  Sync to Profile
                                </button>
                              )}
                              {syncStatus === 'syncing' && <span style={{ fontSize: '0.8rem', color: '#103567' }}>⌛ Syncing...</span>}
                              {syncStatus === 'success' && <span style={{ fontSize: '0.8rem', color: '#276749', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> Profile Updated</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                              <div><span style={{ color: '#666' }}>Name:</span> <br /> <strong>{extractedData.full_name || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Survey No:</span> <br /> <strong>{extractedData.survey_number || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Land Area:</span> <br /> <strong>{extractedData.land_area || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>Village:</span> <br /> <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{extractedData.village || '---'} {extractedData.village && <Home size={12} />}</strong></div>
                              <div><span style={{ color: '#666' }}>Taluka:</span> <br /> <strong>{extractedData.taluka || '---'}</strong></div>
                              <div><span style={{ color: '#666' }}>District:</span> <br /> <strong>{extractedData.district || '---'}</strong></div>
                            </div>
                          </div>
                        )}

                        {pdfInsights.split('\n').map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={i} style={{ height: '8px' }} />;
                          if (trimmed.startsWith('##') || trimmed.startsWith('**')) {
                            return <p key={i} style={{ fontWeight: 700, color: '#103567', margin: '14px 0 6px', fontSize: '1rem' }}>{trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</p>;
                          }
                          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            return <p key={i} style={{ margin: '4px 0 4px 18px', color: '#2d3748', fontSize: '0.9rem' }}>• {trimmed.slice(2)}</p>;
                          }
                          return <p key={i} style={{ margin: '6px 0', color: '#4a5568', fontSize: '0.92rem', lineHeight: 1.6 }}>{trimmed}</p>;
                        })}


                        {/* Eligible Schemes Section — ALWAYS VISIBLE */}
                        <div className="pdf-only-schemes" style={{ marginTop: '24px' }}>
                          <h3 style={{ borderBottom: '2px solid #103567', paddingBottom: '8px', color: '#103567', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={20} /> Eligible Government Schemes
                          </h3>
                          <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#666', marginBottom: '12px' }}>
                            Based on your uploaded document{extractedData?.survey_number ? ` (Survey No: ${extractedData.survey_number})` : ''} and profile data.
                          </p>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ background: '#103567', color: 'white', textAlign: 'left' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>#</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Scheme Name</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Benefit</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Documents Required</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #ddd' }}>Apply</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(hardcodedSchemes.length > 0 ? hardcodedSchemes : [
                                { name: 'PM Kisan Samman Nidhi', benefit: '₹6,000/year', documents: '7/12 Extract, Aadhar, Bank A/C', portal: 'https://pmkisan.gov.in/' },
                                { name: 'PM Fasal Bima Yojana', benefit: 'Crop insurance at 2%', documents: '7/12, Sowing Cert, Bank A/C', portal: 'https://pmfby.gov.in/' },
                                { name: 'Kisan Credit Card', benefit: '₹3L at 4% interest', documents: '7/12, Aadhar, PAN', portal: 'https://pmkisan.gov.in/KCCForm.aspx' },
                                { name: 'Soil Health Card', benefit: 'Free soil testing', documents: '7/12, Aadhar', portal: 'https://soilhealth.dac.gov.in/' },
                                { name: 'PM Krishi Sinchai Yojana', benefit: '55% irrigation subsidy', documents: '7/12, 8A, Aadhar', portal: 'https://pmksy.gov.in/' },
                                { name: 'Gopinath Munde Vima Yojana', benefit: '₹2L accident insurance', documents: '7/12, Aadhar, Age Proof', portal: 'https://krishi.maharashtra.gov.in/' },
                                { name: 'Nanaji Deshmukh Krushi Sanjivani', benefit: '75% farm pond subsidy', documents: '7/12, Aadhar, Bank A/C', portal: 'https://pocra.mahait.org/' },
                                { name: 'Shetkari Karj Mukti Yojana', benefit: 'Loan waiver up to ₹2L', documents: '7/12, Bank Statement, Domicile', portal: 'https://karjmafi.mahait.org/' },
                              ]).map((s, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#f7fafc' : 'white' }}>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#103567' }}>{idx + 1}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{s.name}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', color: '#276749' }}>{s.benefit}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', color: '#666', fontSize: '0.78rem' }}>{s.documents}</td>
                                  <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                                    <a href={s.portal} target="_blank" rel="noopener noreferrer"
                                      style={{ color: '#103567', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      Apply <ArrowRight size={14} />
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#eef2ff', borderLeft: '4px solid #103567', borderRadius: '4px', fontSize: '0.82rem', color: '#2d3748', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <Lightbulb size={20} color="#103567" style={{ flexShrink: 0 }} />
                            <span><strong>Tip:</strong> Visit the <strong>Browse Schemes</strong> tab for detailed information on each scheme including full eligibility criteria, start/end dates, and application guidance.</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <button
                          onClick={() => navigator.clipboard?.writeText(pdfInsights)}
                          style={{ background: 'none', border: '1px solid #103567', borderRadius: '6px', padding: '8px 16px', color: '#103567', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        ><ClipboardList size={16} /> Copy Text</button>

                        <button
                          onClick={() => {
                            const element = document.getElementById('pdf-export-content');
                            // Show headers
                            const header = element.querySelector('.pdf-only-header');
                            const schemes = element.querySelector('.pdf-only-schemes');
                            if (header) header.style.display = 'block';
                            if (schemes) schemes.style.display = 'block';

                            const opt = {
                              margin: [15, 10],
                              filename: `KrishiSetu_Report_${extractedData?.survey_number || 'Doc'}.pdf`,
                              image: { type: 'jpeg', quality: 0.98 },
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                            };

                            html2pdf().set(opt).from(element).save().then(() => {
                              if (header) header.style.display = 'none';
                              if (schemes) schemes.style.display = 'none';
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
                <div className="tab-content">
                  {!locationParams ? (
                    <div className="location-loading-state" style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', justifyContent: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '24px' }}>
                      <div className="btn-spinner" style={{ width: '40px', height: '40px', borderColor: 'rgba(16, 53, 103, 0.1)', borderTopColor: '#103567' }}></div>
                      <p style={{ fontWeight: 700, color: '#103567' }}>Sychronizing with Satellites...</p>
                    </div>
                  ) : (
                    <LocationMap 
                      locationParams={locationParams} 
                      searchQuery={mapSearchQuery} 
                      onQueryChange={setMapSearchQuery} 
                    />
                  )}
                </div>
              )}

              {activeTab === 'fraud' && (
                <div className="tab-content taaza-dashboard">
                  <div className="taaza-header">
                    <div className="taaza-header-text">
                      <div className="taaza-live-badge"><span className="live-dot"></span> LIVE</div>
                      <h3>{t('tab_taaza')}</h3>
                      <p>{t('taaza_desc')}</p>
                    </div>
                    <button 
                      className={`taaza-refresh-btn ${isSyncingNews ? 'spinning' : ''}`}
                      onClick={syncNews}
                      title="Sync Live News"
                      disabled={isSyncingNews}
                    >
                      <RefreshCcw size={20} />
                      <span>{isSyncingNews ? 'Syncing...' : 'Refresh Feed'}</span>
                    </button>
                  </div>

                  <div className="taaza-feed">
                    {taazaKhabarNews.length === 0 ? (
                      <div className="taaza-loading-state">
                        <div className="taaza-shimmer-card"></div>
                        <div className="taaza-shimmer-card"></div>
                        <div className="taaza-shimmer-card"></div>
                        <p className="taaza-loading-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <Sprout size={20} color="#198754" /> Fetching the latest agricultural news...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="taaza-grid">
                          {taazaKhabarNews.map((newsItem, idx) => (
                            <a
                              key={newsItem._id || idx}
                              href={newsItem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="taaza-card"
                              style={{ animationDelay: `${(idx % 10) * 60}ms` }}
                            >
                              <div className="taaza-card-image">
                                <img
                                  src={newsItem.image_url || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop'}
                                  alt="news"
                                  loading="lazy"
                                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600&auto=format&fit=crop'; }}
                                />
                                <div className={`taaza-badge ${newsItem.priority > 35 ? 'trending' : 'latest'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {newsItem.priority > 35 ? <Flame size={12} /> : <Newspaper size={12} />}
                                  {newsItem.priority > 35 ? 'Trending' : 'Latest'}
                                </div>
                              </div>
                              <div className="taaza-card-body">
                                <div className="taaza-meta">
                                  <span className="taaza-source">{newsItem.source || 'Agriculture Portal'}</span>
                                  <span className="taaza-dot">•</span>
                                  <span className="taaza-date">{newsItem.published_date || 'Today'}</span>
                                </div>
                                <h4 className="taaza-title">{newsItem.title}</h4>
                                <p className="taaza-summary">{newsItem.summary}</p>
                                <div className="taaza-read-more" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  Read Full Article <ArrowRight size={14} />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>

                        {hasMoreNews && (
                          <div className="taaza-load-more-container">
                            <button
                              className="taaza-load-more-btn"
                              onClick={loadMoreNews}
                              disabled={newsLoading}
                            >
                              {newsLoading ? (
                                <><span className="btn-spinner"></span> Loading...</>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Newspaper size={18} /> Show More News</div>
                              )}
                            </button>
                          </div>
                        )}

                        {!hasMoreNews && taazaKhabarNews.length > 0 && (
                          <p className="taaza-end-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} /> You've caught up with all the latest news!
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'crop-doctor' && (
                <div className="tab-content">
                  <CropDoctor />
                </div>
              )}

              {activeTab === 'msp' && (
                <div className="tab-content">
                  <MSPTracker />
                </div>
              )}

              {activeTab === 'marketplace' && (
                <div className="tab-content">
                  <Marketplace 
                    isDarkMode={isDarkMode} 
                    language={selectedLanguage} 
                    dictionary={DICTIONARY[selectedLanguage]} 
                  />
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
                    <p>Future eligibility alerts and confirmation receipt have been linked to your registered mobile via <strong>WhatsApp (+91 9529707672)</strong>.</p>
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
                  <label>Theme</label>
                  <div className="acc-grid">
                    <div className={`acc-option ${!isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(false)}>
                      <Sun size={20} />
                      <span>Light Mode</span>
                    </div>
                    <div className={`acc-option ${isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(true)}>
                      <Moon size={20} />
                      <span>Dark Mode</span>
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
          <VapiChatAssistant 
            language={selectedLanguage} 
            dictionary={DICTIONARY[selectedLanguage]} 
          />
        </>
      } />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </div>
);
}

export default App;